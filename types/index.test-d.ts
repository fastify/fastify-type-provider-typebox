import { TypeBoxTypeProvider, ajvTypeBoxPlugin } from '../index'
import { Type } from '@sinclair/typebox'
import { expectAssignable, expectType } from 'tsd'
import Fastify, { FastifyInstance, FastifyLoggerInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from 'fastify'

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>()
expectAssignable<FastifyInstance<RawServerDefault, RawRequestDefaultExpression, RawReplyDefaultExpression, FastifyLoggerInstance, TypeBoxTypeProvider>>(fastify)

fastify.get('/', {
  schema: {
    body: Type.Object({
      x: Type.String(),
      y: Type.Number(),
      z: Type.Boolean()
    })
  }
}, (req) => {
  expectType<boolean>(req.body.z)
  expectType<number>(req.body.y)
  expectType<string>(req.body.x)
})

expectAssignable<FastifyInstance>(Fastify({ ajv: { plugins: [ajvTypeBoxPlugin] } }))
expectType<void>(ajvTypeBoxPlugin({ addKeyword: () => {} }))
