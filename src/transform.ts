import { FastifyInstance, FastifySchemaCompiler, FastifyTypeProvider, preValidationHookHandler } from 'fastify'
import { StaticDecode, TSchema } from '@sinclair/typebox'
import { TypeCompiler, TypeCheck } from '@sinclair/typebox/compiler'
import { Value } from '@sinclair/typebox/value'

/** Functions used to transform values during validation and preSerialization phases */
namespace TransformFunctions {
  const typechecks = new Map<TSchema, TypeCheck<TSchema>>()
  function ResolveCheck (schema: TSchema): TypeCheck<TSchema> {
    if (typechecks.has(schema)) return typechecks.get(schema)!
    typechecks.set(schema, TypeCompiler.Compile(schema))
    return typechecks.get(schema)!
  }
  /* Converts request params, querystrings and headers into their target type */
  export function Convert<T extends TSchema> (httpPart: string | undefined, schema: T, value: unknown) {
    return httpPart === 'body' ? value : Value.Convert(schema as TSchema, value)
  }
  /* Generates errors for the given value. This function is only called on decode error. */
  export function Errors<T extends TSchema> (schema: T, value: unknown) {
    return [...ResolveCheck(schema).Errors(value)].map((error) => {
      return { message: `${error.message}`, instancePath: error.path }
    })
  }
  /** Decodes a value or returns undefined if error */
  export function Decode<T extends TSchema> (schema: T, value: unknown): unknown {
    try {
      return ResolveCheck(schema).Decode(value)
    } catch {
      return undefined
    }
  }
  /** Encodes a value or throws if error */
  export function Encode<T extends TSchema> (schema: T, value: unknown) {
    return ResolveCheck(schema).Encode(value)
  }
}
const TypeBoxValidatorCompiler: FastifySchemaCompiler<TSchema> = ({ schema, httpPart }) => {
  return (value): any => {
    const converted = TransformFunctions.Convert(httpPart, schema, value)
    const decoded = TransformFunctions.Decode(schema, converted)
    return decoded ? { value: decoded } : { error: TransformFunctions.Errors(schema, converted) }
  }
}
const TypeBoxPreSerializationHook: preValidationHookHandler = (...args: any[]) => {
  const [request, reply, payload, done] = args
  const response = request?.routeSchema?.response
  const schema = response ? response[reply.statusCode] : undefined
  try {
    return schema !== undefined
      ? done(null, TransformFunctions.Encode(schema, payload))
      : done(null, payload) // no schema to encode
  } catch (error) {
    done(error, null)
  }
}
/** `[Experimental]` Specialized Type Provider that supports Transform type decoding */
export interface TypeBoxTransformDecodeProvider extends FastifyTypeProvider {
  output: this['input'] extends TSchema ? StaticDecode<this['input']> : unknown
}
/**
 * `[Experimental]` Configures a Fastify instance to use the TypeBox Transform infrastructure.
 * @param instance The fastify instance to configure
 * @returns The configured instance.
 */
export function TypeBoxTransformProvider<T extends FastifyInstance> (instance: T) {
  return instance.withTypeProvider<TypeBoxTransformDecodeProvider>()
    .addHook('preSerialization', TypeBoxPreSerializationHook)
    .setValidatorCompiler(TypeBoxValidatorCompiler)
}
