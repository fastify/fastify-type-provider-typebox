'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const Fastify = require('fastify')
const { Format, Type, TypeBoxValidatorCompiler, createTypeBoxValidatorCompiler, registerAjvFormats } = require('../dist/cjs/index')

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

test('should validate body with registered formats', async () => {
  registerAjvFormats()

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
        ip: Type.String({ format: 'ipv4' })
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
      ip: '127.0.0.1'
    }
  })

  assert.strictEqual(res.statusCode, 200)
})

test('should validate schemas with referenced schemas using createTypeBoxValidatorCompiler (array references)', async () => {
  const Address = Type.Object({
    street: Type.String(),
    city: Type.String()
  }, { $id: 'Address' })

  const User = Type.Object({
    name: Type.String(),
    address: Type.Ref('Address')
  })

  const app = Fastify().setValidatorCompiler(createTypeBoxValidatorCompiler({
    references: [Address]
  }))

  app.post('/user', {
    schema: {
      body: User
    }
  }, (req, reply) => reply.send(req.body))

  const validRes = await app.inject({
    method: 'POST',
    url: '/user',
    payload: {
      name: 'Alice',
      address: {
        street: '123 Main St',
        city: 'Metropolis'
      }
    }
  })

  assert.strictEqual(validRes.statusCode, 200)
  assert.deepStrictEqual(validRes.json(), {
    name: 'Alice',
    address: {
      street: '123 Main St',
      city: 'Metropolis'
    }
  })

  const invalidRes = await app.inject({
    method: 'POST',
    url: '/user',
    payload: {
      name: 'Alice',
      address: {
        street: 123
      }
    }
  })

  assert.strictEqual(invalidRes.statusCode, 400)
})

test('should validate schemas with referenced schemas using createTypeBoxValidatorCompiler (record references)', async () => {
  const Role = Type.Object({
    title: Type.String(),
    level: Type.Number()
  })

  const Employee = Type.Object({
    id: Type.String(),
    role: Type.Ref('Role')
  })

  const app = Fastify().setValidatorCompiler(createTypeBoxValidatorCompiler({
    references: { Role }
  }))

  app.post('/employee', {
    schema: {
      body: Employee
    }
  }, (req, reply) => reply.send(req.body))

  const validRes = await app.inject({
    method: 'POST',
    url: '/employee',
    payload: {
      id: 'emp-1',
      role: {
        title: 'Engineer',
        level: 3
      }
    }
  })

  assert.strictEqual(validRes.statusCode, 200)
  assert.deepStrictEqual(validRes.json(), {
    id: 'emp-1',
    role: {
      title: 'Engineer',
      level: 3
    }
  })

  const invalidRes = await app.inject({
    method: 'POST',
    url: '/employee',
    payload: {
      id: 'emp-1',
      role: {
        title: 'Engineer',
        level: 'senior'
      }
    }
  })

  assert.strictEqual(invalidRes.statusCode, 400)
})

test('should convert querystring with referenced schemas using createTypeBoxValidatorCompiler', async () => {
  const Filter = Type.Object({
    limit: Type.Number(),
    offset: Type.Number()
  }, { $id: 'Filter' })

  const app = Fastify().setValidatorCompiler(createTypeBoxValidatorCompiler({
    references: [Filter]
  }))

  app.get('/items', {
    schema: {
      querystring: Type.Ref('Filter')
    }
  }, (req, reply) => reply.send(req.query))

  const res = await app.inject({
    method: 'GET',
    url: '/items',
    query: {
      limit: '10',
      offset: '20'
    }
  })

  assert.strictEqual(res.statusCode, 200)
  assert.strictEqual(res.json().limit, 10)
  assert.strictEqual(res.json().offset, 20)
})
