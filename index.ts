import * as ajvFormats from 'ajv-formats'
import { type FormatName } from 'ajv-formats'
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

const formatNamesMapper = {
  date: true,
  time: true,
  'date-time': true,
  'iso-time': true,
  'iso-date-time': true,
  duration: true,
  uri: true,
  'uri-reference': true,
  'uri-template': true,
  url: true,
  email: true,
  hostname: true,
  ipv4: true,
  ipv6: true,
  regex: true,
  uuid: true,
  'json-pointer': true,
  'json-pointer-uri-fragment': true,
  'relative-json-pointer': true,
  byte: true,
  int32: true,
  int64: true,
  float: true,
  double: true,
  password: true,
  binary: true,
} as const satisfies Record<FormatName, true>

const formatNames = Object.keys(formatNamesMapper) as FormatName[]

type AjvFormat = {
  validate: (value: string) => boolean
}

function isAjvFormat (value: unknown): value is AjvFormat {
  return typeof value === 'object' && value !== null && 'validate' in value
}

function getFormatValidator (format: unknown): (value: string) => boolean {
  if (isAjvFormat(format)) {
    return format.validate
  }
  if (format === true) {
    return () => true
  }
  if (format instanceof RegExp) {
    return (value) => format.test(value)
  }
  if (typeof format === 'function') {
    return format as (value: string) => boolean
  }
  throw new TypeError('Unsupported AJV format definition')
}

export function registerAjvFormats () {
  for (const name of formatNames) {
    Format.Set(name, getFormatValidator(ajvFormats.default.default.get(name)))
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
export const TypeBoxValidatorCompiler: FastifySchemaCompiler<TSchema> = ({
  schema,
  httpPart,
}) => {
  const typeCheck = Compile(schema)
  return (value): any /* TODO: remove any for next major */ => {
    // Note: Only support value conversion for querystring, params and header schematics
    const converted =
      httpPart === 'body' ? value : Value.Convert(schema, value)
    if (typeCheck.Check(converted)) {
      return { value: converted }
    }

    const errors: FastifySchemaValidationError[] = typeCheck.Errors(converted)

    return {
      error: errors,
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
  validator: this['schema'] extends TSchema ? Static<this['schema']> : unknown;
  serializer: this['schema'] extends TSchema ? Static<this['schema']> : unknown;
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
