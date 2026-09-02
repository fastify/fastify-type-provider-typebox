import { test } from 'node:test'
import assert from 'node:assert'
import { createRequire } from 'node:module'
import * as ajvFormatsNamespace from 'ajv-formats'
import Fastify from 'fastify'
import { Format, Type, TypeBoxValidatorCompiler, registerAjvFormats } from '../dist/esm/index.mjs'

// `ajv-formats` is CommonJS, so the mockable plugin object lives on the
// namespace's default export. The namespace object itself is sealed.
const ajvFormats = ajvFormatsNamespace.default

test('should expose the same API through the CommonJS build', () => {
  const require = createRequire(import.meta.url)
  const cjs = require('../dist/cjs/index.js')

  assert.strictEqual(typeof cjs.TypeBoxValidatorCompiler, 'function')
  assert.strictEqual(typeof cjs.registerAjvFormats, 'function')
  assert.strictEqual(typeof cjs.Type.Object, 'function')
  assert.strictEqual(typeof cjs.Format.Set, 'function')
})

test('should compile typebox schema without configuration', async () => {
  const fastify = Fastify().get('/', {
    schema: {
      querystring: Type.Object({
        x: Type.Number(),
        y: Type.Number(),
        z: Type.Number()
      })
    }
  }, (_req, _res) => { })
  await fastify.ready()
  assert.ok(true)
})

test('should not compile schema with unknown keywords', async () => {
  const fastify = Fastify().get('/', {
    schema: {
      querystring: Type.Object({
        x: Type.Number(),
        y: Type.Number(),
        z: Type.Number()
      }, { kind: 'Object' }) // unknown keyword
    }
  }, (_req, _res) => { })

  await assert.rejects(fastify.ready())
})

test('should validate querystring parameters', async () => {
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.String(),
        b: Type.String(),
        c: Type.String()
      })
    }
  }, (req, res) => res.send(req.query))

  const { a, b, c } = await fastify.inject()
    .get('/')
    .query({ a: '1', b: '2', c: '3' })
    .then(res => res.json())

  assert.strictEqual(a, '1')
  assert.strictEqual(b, '2')
  assert.strictEqual(c, '3')
})

test('should not validate querystring parameters', async () => {
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.String(),
        b: Type.String(),
        c: Type.String()
      })
    }
  }, (req, res) => res.send(req.query))

  const statusCode = await fastify.inject()
    .get('/')
    .query({ a: '1', b: '2' })
    .then(res => res.statusCode)

  assert.strictEqual(statusCode, 400)
})

test('should return validation error message on response', async () => {
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.String(),
        b: Type.String(),
        c: Type.String()
      })
    }
  }, (req, res) => res.send(req.query))

  const response = await fastify.inject()
    .get('/')
    .query({ a: '1', b: '2' })
    .then(res => res.json())

  assert.ok(response.message.includes('must have required properties c'))
})

test('should convert numeric strings into numbers if conversion is possible', async () => {
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.Number(),
        b: Type.Number()
      })
    }
  }, (req, res) => res.send(req.query))

  const response = await fastify.inject()
    .get('/')
    .query({ a: '1', b: '2' })
    .then(res => res.json())

  assert.strictEqual(response.a, 1)
  assert.strictEqual(response.b, 2)
})

test('should return validation error message as body value conversion is not supported', async () => {
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).post('/', {
    schema: {
      body: Type.Object({
        a: Type.Number(),
        b: Type.Number()
      })
    }
  }, (req, res) => res.send(req.query))

  const headers = { 'content-type': 'application/json' }
  const body = { a: '1', b: 2 }

  const response = await fastify.inject()
    .post('/')
    .headers(headers)
    .body(body)
    .then(res => res.json())

  assert.ok(response.message.startsWith('body/a'))
})

test('should return validation error message if no conversion is possible', async () => {
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.Number(),
        b: Type.Number()
      })
    }
  }, (req, res) => res.send(req.query))

  const response = await fastify.inject()
    .get('/')
    .query({ a: 'hello', b: '2' })
    .then(res => res.json())

  assert.ok(response.message.startsWith('querystring/a'))
})

test('should fast serialize for the typebox 0.26.0 allOf intersect representation', async () => {
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      response: {
        200: Type.Intersect([
          Type.Object({ a: Type.Number() }),
          Type.Object({ b: Type.Number() })
        ])
      }
    }
  }, (_req, res) => res.send({ a: 1, b: 2 }))

  const response = await fastify.inject()
    .get('/')
    .then(res => res.json())

  assert.strictEqual(response.a, 1)
  assert.strictEqual(response.b, 2)
})

test('should validate body with a custom format', async () => {
  const formatName = 'custom-format'
  const formatRegex = /^\d{3}[a-z]{3}$/
  Format.Set(formatName, (value) => formatRegex.test(value))

  const app = Fastify()
    .setValidatorCompiler(TypeBoxValidatorCompiler)

  app.post('/', {
    schema: {
      body: Type.Object({
        prop: Type.String({ format: formatName })
      })
    }
  }, (req, res) => res.send(req.body))

  const res = await app.inject({
    method: 'POST',
    url: '/',
    payload: { prop: '123abc' }
  })

  assert.strictEqual(res.statusCode, 200)
})

test('should validate body with registered formats', async (t) => {
  Format.Clear()
  t.after(() => Format.Reset())

  registerAjvFormats()

  assert.deepStrictEqual([...Format.Entries()].map(([name]) => name), [
    'date',
    'time',
    'date-time',
    'iso-time',
    'iso-date-time',
    'duration',
    'uri',
    'uri-reference',
    'uri-template',
    'url',
    'email',
    'hostname',
    'ipv4',
    'ipv6',
    'regex',
    'uuid',
    'json-pointer',
    'json-pointer-uri-fragment',
    'relative-json-pointer',
    'byte',
    'int32',
    'int64',
    'float',
    'double',
    'password',
    'binary'
  ])

  const app = Fastify()
    .setValidatorCompiler(TypeBoxValidatorCompiler)

  app.post('/', {
    schema: {
      body: Type.Object({
        date: Type.String({ format: 'date' }),
        dateTime: Type.String({ format: 'date-time' }),
        email: Type.String({ format: 'email' }),
        uuid: Type.String({ format: 'uuid' }),
        url: Type.String({ format: 'url' }),
        ip: Type.String({ format: 'ipv4' }),
        uri: Type.String({ format: 'uri' }),
        password: Type.String({ format: 'password' })
      })
    }
  }, (req, reply) => reply.send(req.body))

  const res = await app.inject({
    method: 'POST',
    url: '/',
    payload: {
      date: '2024-01-01',
      dateTime: '2024-01-01T10:10:10Z',
      email: 'test@test.com',
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      url: 'https://fastify.dev',
      ip: '127.0.0.1',
      uri: 'https://fastify.dev',
      password: 'secret'
    }
  })

  assert.strictEqual(res.statusCode, 200)
})

test('should reject unsupported AJV format definitions', (t) => {
  t.mock.method(ajvFormats, 'get', () => null)

  assert.throws(registerAjvFormats, {
    name: 'TypeError',
    message: 'Unsupported AJV format definition'
  })
})
