const tap = require('tap')
const Fastify = require('fastify')
const { Type, TypeBoxValidatorCompiler } = require('../dist/index')

// This test ensures AJV ignores the TypeBox [Kind] symbol property in strict
tap.test('should compile typebox schema without configuration', async t => {
  t.plan(1)
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
  t.pass()
})

// This test ensures AJV internally throws for unknown schema properties in strict
tap.test('should not compile schema with unknown keywords', async t => {
  t.plan(1)
  const fastify = Fastify().get('/', {
    schema: {
      querystring: Type.Object({
        x: Type.Number(),
        y: Type.Number(),
        z: Type.Number()
      }, { kind: 'Object' }) // unknown keyword
    }
  }, (_req, _res) => { })
  try {
    await fastify.ready() // expect throw
    t.fail()
  } catch {
    t.pass()
  }
})

tap.test('should validate querystring parameters', async t => {
  t.plan(1)
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.String(),
        b: Type.String(),
        c: Type.String()
      })
    }
  }, (req, res) => res.send(req.query))
  const { a, b, c } = await fastify.inject().get('/').query({ a: '1', b: '2', c: '3' }).then(res => res.json())
  if (a === '1' && b === '2' && c === '3') {
    t.pass()
  } else {
    t.fail()
  }
})

tap.test('should not validate querystring parameters', async t => {
  t.plan(1)
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.String(),
        b: Type.String(),
        c: Type.String()
      })
    }
  }, (req, res) => res.send(req.query))
  const statusCode = await fastify.inject().get('/').query({ a: '1', b: '2' }).then(res => res.statusCode)
  t.equal(statusCode, 400)
})

tap.test('should return validation error message on response', async t => {
  t.plan(1)
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.String(),
        b: Type.String(),
        c: Type.String()
      })
    }
  }, (req, res) => res.send(req.query))
  const response = await fastify.inject().get('/').query({ a: '1', b: '2' }).then(res => res.json())
  t.equal(response.message.indexOf('querystring/c'), 0)
})

tap.test('should convert numeric strings into numbers if conversion is possible', async t => {
  t.plan(2)
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.Number(),
        b: Type.Number()
      })
    }
  }, (req, res) => res.send(req.query))
  const response = await fastify.inject().get('/').query({ a: '1', b: '2' }).then(res => res.json())
  t.equal(response.a, 1)
  t.equal(response.b, 2)
})

tap.test('should return validation error message as body value conversion is not supported', async t => {
  t.plan(1)
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).post('/', {
    schema: {
      body: Type.Object({
        a: Type.Number(),
        b: Type.Number()
      })
    }
  }, (req, res) => res.send(req.query))
  const headers = { 'content-type': 'application/json' }
  const body = { a: '1', b: 2 } // note: value conversion not support for body schematics
  const response = await fastify.inject().post('/').headers(headers).body(body).then(res => res.json())
  t.equal(response.message.indexOf('body/a'), 0)
})

tap.test('should return validation error message if no conversion is possible', async t => {
  t.plan(1)
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      querystring: Type.Object({
        a: Type.Number(),
        b: Type.Number()
      })
    }
  }, (req, res) => res.send(req.query))
  const response = await fastify.inject().get('/').query({ a: 'hello', b: '2' }).then(res => res.json())
  t.equal(response.message.indexOf('querystring/a'), 0)
})

tap.test('should fast serialize for the typebox 0.26.0 allOf intersect representation', async t => {
  t.plan(2)
  const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
    schema: {
      response: {
        200: Type.Intersect([
          Type.Object({ a: Type.Number() }),
          Type.Object({ b: Type.Number() })
        ])
      }
    }
  }, (req, res) => res.send({ a: 1, b: 2 }))
  const response = await fastify.inject().get('/').then(res => res.json())
  t.equal(response.a, 1)
  t.equal(response.b, 2)
})
