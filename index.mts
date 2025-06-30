import {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifySchemaCompiler,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault
} from 'fastify'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Static, TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
export * from '@sinclair/typebox'
/**
 * Enables TypeBox schema validation
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 *
 * const server = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler)
 * ```
 */
export const TypeBoxValidatorCompiler: FastifySchemaCompiler<TSchema> = ({ schema, httpPart }) => {
  const typeCheck = TypeCompiler.Compile(schema)
  return (value): any => {
    // Note: Only support value conversion for querystring, params and header schematics
    const converted = httpPart === 'body' ? value : Value.Convert(schema, value)
    if (typeCheck.Check(converted)) {
      return { value: converted }
    }
    const errors = []
    for (const error of typeCheck.Errors(converted)) {
      errors.push({
        message: error.message,
        instancePath: error.path
      })
    }
    return {
      // Note: Here we return a FastifySchemaValidationError[] result. As of writing, Fastify
      // does not currently export this type. Future revisions should uncomment the assertion
      // below and return the full set of properties. The specified properties 'message' and
      // 'instancePath' do however result in a near equivalent error messages to Ajv.
      error: errors // as FastifySchemaValidationError[]
    }
  }
}

/**
 * Enables automatic type inference on a Fastify instance.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 *
 * const server = Fastify().withTypeProvider<TypeBoxTypeProvider>()
 * ```
 */
export interface TypeBoxTypeProvider extends FastifyTypeProvider {
  validator: this['schema'] extends TSchema ? Static<this['schema']> : unknown
  serializer: this['schema'] extends TSchema ? Static<this['schema']> : unknown
}

/**
 * FastifyPluginCallback with Typebox automatic type inference
 *
 * @example
 * ```typescript
 * import { FastifyPluginCallbackTypebox } fromg "@fastify/type-provider-typebox"
 *
 * const plugin: FastifyPluginCallbackTypebox = (fastify, options, done) => {
 *   done()
 * }
 * ```
 */
export type FastifyPluginCallbackTypebox<
    Options extends FastifyPluginOptions = Record<never, never>,
    Server extends RawServerBase = RawServerDefault,
> = FastifyPluginCallback<Options, Server, TypeBoxTypeProvider>

/**
 * FastifyPluginAsync with Typebox automatic type inference
 *
 * @example
 * ```typescript
 * import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
 *
 * const plugin: FastifyPluginAsyncTypebox = async (fastify, options) => {
 * }
 * ```
 */
export type FastifyPluginAsyncTypebox<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault
> = FastifyPluginAsync<Options, Server, TypeBoxTypeProvider>
