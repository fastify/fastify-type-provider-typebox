import * as ajvFormats from 'ajv-formats'
import {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifySchemaCompiler,
  FastifySchemaValidationError,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault
} from 'fastify'
import { type Static, type TSchema } from 'typebox'
import { Compile } from 'typebox/compile'
import Format from 'typebox/format'
import { Value } from 'typebox/value'

export * from 'typebox'
export { default as Format } from 'typebox/format'

const rawFormats = (ajvFormats as any).default?.default ??
                     (ajvFormats as any).default ??
                     ajvFormats

type AjvFormat = {
  validate: (value: string) => boolean
}

function isAjvFormat (value: unknown): value is AjvFormat {
  return typeof value === 'object' && value !== null && 'validate' in value
}

export function registerAjvFormats () {
  const formats = rawFormats as Record<string, unknown>

  for (const [name, def] of Object.entries(formats)) {
    if (isAjvFormat(def)) {
      Format.Set(name, def.validate)
    }
  }
}

export interface TypeBoxValidatorCompilerOptions {
  /**
   * Schemas referenced via Type.Ref() to be passed as context to the TypeBox compiler and converter.
   * Can be provided as an array of schemas with `$id` properties or as a dictionary mapping IDs to schemas.
   */
  references?: TSchema[] | Record<string, TSchema>
}

function resolveContext (references?: TSchema[] | Record<string, TSchema>): Record<string, TSchema> | undefined {
  if (!references) return undefined
  if (Array.isArray(references)) {
    const context: Record<string, TSchema> = {}
    for (const schema of references) {
      if (typeof schema === 'object' && schema !== null && '$id' in schema && typeof schema.$id === 'string') {
        context[schema.$id] = schema
      }
    }
    return context
  }
  return references
}

/**
 * Creates a TypeBox validator compiler with custom options, such as referenced schemas.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 * import { createTypeBoxValidatorCompiler, Type } from '@fastify/type-provider-typebox'
 *
 * const Address = Type.Object({ street: Type.String() }, { $id: 'Address' })
 * const server = Fastify().setValidatorCompiler(createTypeBoxValidatorCompiler({ references: [Address] }))
 * ```
 */
export function createTypeBoxValidatorCompiler (options?: TypeBoxValidatorCompilerOptions): FastifySchemaCompiler<TSchema> {
  const context = resolveContext(options?.references)
  return ({ schema, httpPart }) => {
    const typeCheck = context ? Compile(context, schema) : Compile(schema)
    return (value): any /* TODO: remove any for next major */ => {
      // Note: Only support value conversion for querystring, params and header schematics
      const converted = httpPart === 'body'
        ? value
        : (context ? Value.Convert(context, schema, value) : Value.Convert(schema, value))
      if (typeCheck.Check(converted)) {
        return { value: converted }
      }

      const errors: FastifySchemaValidationError[] = typeCheck.Errors(converted)

      return {
        error: errors
      }
    }
  }
}

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
export const TypeBoxValidatorCompiler: FastifySchemaCompiler<TSchema> = createTypeBoxValidatorCompiler()

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
 * import { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox"
 *
 * const plugin: FastifyPluginCallbackTypebox = (fastify, options, done) => {
 *   done()
 * }
 * ```
 */
export type FastifyPluginCallbackTypebox<
    Options extends FastifyPluginOptions = Record<never, never>,
    Server extends RawServerBase = RawServerDefault
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
