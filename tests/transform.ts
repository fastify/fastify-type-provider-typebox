const tap = require('tap')
const Fastify = require('fastify')
const { TypeBoxTransformProvider } = require('../dist/transform')
const { Type } = require('../dist/provider')

tap.test('Transform: should decode', async t => {
  t.plan(1)
  const Input = Type.Transform(Type.Number())
    .Decode(value => value + 1)
    .Encode(value => { throw Error('unused') })
  const fastify = TypeBoxTransformProvider(Fastify()).post('/', {
    schema: {
      body: Input
    }
  }, (req, res) => res.send(req.body))
  const response = await fastify.inject().post('/').body(1000).then(res => res.json())
  t.equal(response, 1001)
})
tap.test('Transform: should encode', async t => {
  t.plan(1)
  const Output = Type.Transform(Type.Number())
    .Decode(value => { throw Error('unused') })
    .Encode(value => value + 1) // expect + 1
  const fastify = TypeBoxTransformProvider(Fastify()).get('/', {
    schema: {
      response: { 200: Output }
    }
  }, (req, res) => res.send(1000))
  const response = await fastify.inject().get('/').then(res => res.json())
  t.equal(response, 1001)
})
tap.test('Transform: should not encode for unknown status code', async t => {
  t.plan(1)
  const Output = Type.Transform(Type.Number())
    .Decode(value => { throw Error('unused') })
    .Encode(value => value + 1) // expect + 1
  const fastify = TypeBoxTransformProvider(Fastify()).get('/', {
    schema: {
      response: { 200: Output }
    }
  }, (req, res) => res.status(201).send(1000)) // no schema for 201
  const response = await fastify.inject().get('/').then(res => res.json())
  t.equal(response, 1000)
})
tap.test('Transform: should encode on 404 status', async t => {
  t.plan(1)
  const Output = Type.Transform(Type.Number())
    .Decode(value => { throw Error('unused') })
    .Encode(value => value + 1) // expect + 1
  const fastify = TypeBoxTransformProvider(Fastify()).get('/', {
    schema: {
      response: { 404: Output }
    }
  }, (req, res) => res.status(404).send(1000))
  const response = await fastify.inject().get('/').then(res => res.json())
  t.equal(response, 1001)
})
tap.test('Transform: should decode and encode', async t => {
  t.plan(1)
  const InputOutput = Type.Transform(Type.Number())
    .Decode(value => value + 1)
    .Encode(value => value + 1) // expect + 2
  const fastify = TypeBoxTransformProvider(Fastify()).post('/', {
    schema: {
      body: InputOutput,
      response: { 200: InputOutput }
    }
  }, (req, res) => res.send(req.body))
  const response = await fastify.inject().post('/').body(1000).then(res => res.json())
  t.equal(response, 1002)
})
tap.test('Transform: should decode and encode for non-serializable object', async t => {
  t.plan(1)
  const InputOutput = Type.Transform(Type.Number())
    .Decode(value => new Date(value)) // number to Date
    .Encode(value => value.getTime()) // Date to number
  const fastify = TypeBoxTransformProvider(Fastify()).post('/', {
    schema: {
      body: InputOutput,
      response: { 200: InputOutput }
    }
  }, (req, res) => {
    // expect input as date
    if (!(req.body instanceof Date)) throw Error('Expected Date')
    if (req.body.getTime() !== 1337) throw Error('Expected 1337')
    res.send(req.body)
  })
  const response = await fastify.inject().post('/').body(1337).then(res => res.json())
  t.equal(response, 1337)
})
tap.test('Transform: expect 400 bad request', async t => {
  t.plan(1)
  const InputOutput = Type.Transform(Type.Number())
    .Decode(value => value)
    .Encode(value => value) // identity
  const fastify = TypeBoxTransformProvider(Fastify()).post('/', {
    schema: {
      body: InputOutput,
      response: { 200: InputOutput }
    }
  }, (req, res) => {
    res.send(req.body)
  })
  const response = await fastify.inject().post('/').headers({ 'content-type': 'application/json' }).body('not-a-number').end()
  console.log(response.statusCode)
  t.equal(response.statusCode, 400)
})
tap.test('Transform: expect 500 on encode throw', async t => {
  t.plan(1)
  const InputOutput = Type.Transform(Type.Number())
    .Decode(value => new Date(value))
    .Encode(value => value.getTime(value)) // expect throw here
  const fastify = TypeBoxTransformProvider(Fastify()).post('/', {
    schema: {
      body: InputOutput,
      response: { 200: InputOutput }
    }
  }, (req, res) => {
    // expect input as date
    if (!(req.body instanceof Date)) throw Error('Expected Date')
    if (req.body.getTime() !== 1337) throw Error('Expected 1337')
    res.status(200).send(null) // sent to encode to error on value.getTime()
  })
  const response = await fastify.inject().post('/').headers({ 'content-type': 'application/json' }).body(1337).end()
  t.equal(response.statusCode, 500)
})
