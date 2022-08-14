import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifySchemaCompiler,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault
} from 'fastify'

import type {
  Static,
  TSchema,
  SchemaOptions
} from '@sinclair/typebox'

import { TypeCompiler } from '@sinclair/typebox/compiler'
import { TypeBuilder, Kind } from '@sinclair/typebox'

// ----------------------------------------------------------------------------
// FastifyTypeBuilder
// ----------------------------------------------------------------------------

export interface DateOptions extends SchemaOptions {}

export interface TDate extends TSchema, DateOptions {
  static: Date | string,
  [Kind]: 'String',
  type: 'string',
  format: 'date'
}

export class FastifyTypeBuilder extends TypeBuilder {
  /** Fastify Extension Type: Creates a Date type that infers as Date | string */
  public Date (options: DateOptions = {}): TDate {
    return super.Create({ ...options, [Kind]: 'String', type: 'string', format: 'date' })
  }
}

export const Type = new FastifyTypeBuilder()

// ----------------------------------------------------------------------------
// TypeBoxValidatorCompiler
// ----------------------------------------------------------------------------

/** Enables TypeBox schema validation */
export const TypeBoxValidatorCompiler: FastifySchemaCompiler<TSchema> = ({ schema }) => {
  const typeCheck = TypeCompiler.Compile(schema)
  return (value): any => {
    if (typeCheck.Check(value)) return
    const errors = [...typeCheck.Errors(value)]
    return {
      // Note: Here we return a FastifySchemaValidationError[] result. As of writing, Fastify
      // does not currently export this type. Future revisions should uncomment the assertion
      // below and return the full set of properties. The specified properties 'message' and
      // 'instancePath' do however result in a near equivalent error messages to Ajv.
      error: errors.map((error) => ({
        message: `${error.message}`,
        instancePath: error.path
      })) // as FastifySchemaValidationError[]
    }
  }
}

// ----------------------------------------------------------------------------
// TypeBoxTypeProvider
// ----------------------------------------------------------------------------

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
  output: this['input'] extends TSchema ? Static<this['input']> : never
}

// ----------------------------------------------------------------------------
// FastifyPluginCallback
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// FastifyPluginAsyncTypebox
// ----------------------------------------------------------------------------

/**
 * FastifyPluginAsync with Typebox automatic type inference
 *
 * @example
 * ```typescript
 * import { FastifyPluginAsyncTypebox } fromg "@fastify/type-provider-typebox"
 *
 * const plugin: FastifyPluginAsyncTypebox = async (fastify, options) => {
 * }
 * ```
 */
export type FastifyPluginAsyncTypebox<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault
> = FastifyPluginAsync<Options, Server, TypeBoxTypeProvider>

// ----------------------------------------------------------------------------
// TypeBox Infrastructure
// ----------------------------------------------------------------------------

export type {
  ArrayOptions,
  IntersectEvaluate,
  IntersectReduce,
  NumericOptions,
  ObjectOptions,
  ObjectProperties,
  ObjectPropertyKeys,
  OptionalPropertyKeys,
  PropertiesReduce,
  ReadonlyOptionalPropertyKeys,
  ReadonlyPropertyKeys,
  RequiredPropertyKeys,
  SchemaOptions,
  Static,
  StaticContructorParameters,
  StaticFunctionParameters,
  StringFormatOption,
  StringOptions,
  TAny,
  TAnySchema,
  TArray,
  TBoolean,
  TConstructor,
  TConstructorParameters,
  TEnum,
  TEnumOption,
  TFunction,
  TInstanceType,
  TInteger,
  TIntersect,
  TKeyOf,
  TLiteral,
  TLiteralValue,
  TModifier,
  TNull,
  TNumber,
  TNumeric,
  TObject,
  TOmit,
  TOptional,
  TParameters,
  TPartial,
  TPick,
  TPromise,
  TProperties,
  TReadonly,
  TReadonlyOptional,
  TRecord,
  TRecordKey,
  TRecordProperties,
  TRecursive,
  TRecursiveReduce,
  TRef,
  TRequired,
  TReturnType,
  TSchema,
  TSelf,
  TString,
  TTuple,
  TUint8Array,
  TUndefined,
  TUnion,
  TUnknown,
  TUnsafe,
  TVoid,
  TupleToArray,
  TypeBuilder,
  Uint8ArrayOptions,
  UnionLast,
  UnionStringLiteralToTuple,
  UnionToIntersect,
  UnionToTuple,
  UnsafeOptions
} from '@sinclair/typebox'
