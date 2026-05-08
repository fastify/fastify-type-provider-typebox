import { Type, TypeBoxTypeProvider } from '../index.js'
import { expect } from 'tstyche'
import Fastify, { FastifyInstance, FastifyBaseLogger, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from 'fastify'

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>()

expect(fastify).type.toBeAssignableTo<FastifyInstance<
  RawServerDefault, 
  RawRequestDefaultExpression, 
  RawReplyDefaultExpression, 
  FastifyBaseLogger, 
  TypeBoxTypeProvider
>>()
expect(fastify).type.toBeAssignableTo<FastifyInstance>()

fastify.get('/', {
  schema: {
    body: Type.Object({
      x: Type.String(),
      y: Type.Number(),
      z: Type.Boolean()
    })
  }
}, (req) => {
  expect(req.body.z).type.toBe<boolean>()
  expect(req.body.y).type.toBe<number>()
  expect(req.body.x).type.toBe<string>()
})

expect(Fastify()).type.toBeAssignableTo<FastifyInstance>()