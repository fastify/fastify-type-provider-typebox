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
  if (a === '1' && b === '2' & c === '3') {
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

tap.test('should accept date extension type and refine correctly in handler', async t => {
  t.plan(1)
  let created = null
  const fastify = Fastify().post('/', {
    schema: {
      body: Type.Object({
        created: Type.Date()
      })
    }
  }, (req, res) => {
    created = req.body.created
    res.json(0)
  })
  await fastify.inject().post('/').body({ created: '2022-01-01' }).then(res => res.json())
  t.equal(typeof created, 'string') // note: not refined to Date
})
