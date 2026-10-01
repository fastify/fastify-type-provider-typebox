import { Type, TypeBoxTypeProvider, createTypeBoxValidatorCompiler, TypeBoxValidatorCompiler } from '../index.js'
import { expect } from 'tstyche'
import Fastify, { FastifyInstance, FastifyBaseLogger, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, FastifySchemaCompiler } from 'fastify'
import { TSchema } from 'typebox'

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

const Address = Type.Object({ street: Type.String() }, { $id: 'Address' })
const compilerWithArray = createTypeBoxValidatorCompiler({ references: [Address] })
const compilerWithRecord = createTypeBoxValidatorCompiler({ references: { Address } })
const defaultCompiler = createTypeBoxValidatorCompiler()

expect(compilerWithArray).type.toBeAssignableTo<FastifySchemaCompiler<TSchema>>()
expect(compilerWithRecord).type.toBeAssignableTo<FastifySchemaCompiler<TSchema>>()
expect(defaultCompiler).type.toBeAssignableTo<FastifySchemaCompiler<TSchema>>()
expect(TypeBoxValidatorCompiler).type.toBeAssignableTo<FastifySchemaCompiler<TSchema>>()