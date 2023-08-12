import { TypeBoxTransformProvider, TypeBoxTransformDecodeProvider } from '../src/transform'
import { Type } from '../src/provider'
import { expectAssignable, expectType } from 'tsd'
import Fastify, { FastifyInstance, FastifyBaseLogger, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from 'fastify'

const fastify = Fastify().withTypeProvider<TypeBoxTransformDecodeProvider>()
expectAssignable<FastifyInstance<RawServerDefault, RawRequestDefaultExpression, RawReplyDefaultExpression, FastifyBaseLogger, TypeBoxTransformDecodeProvider>>(fastify)
expectAssignable<FastifyInstance>(fastify)
expectAssignable<FastifyInstance>(TypeBoxTransformProvider(Fastify()))
expectAssignable<FastifyInstance>(Fastify())

// ------------------------------------------------------------
// Transform
// ------------------------------------------------------------
const T = Type.Transform(Type.Number())
  .Decode(value => new Date(value))
  .Encode(value => value.getTime())
fastify.get('/', {
  schema: {
    body: T,
    response: { 200: T }
  }
}, (req, res) => {
  expectType<Date>(req.body)
  res.send(new Date())
})

expectAssignable<FastifyInstance>(Fastify())
