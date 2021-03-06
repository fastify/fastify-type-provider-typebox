import { FastifySchemaCompiler, FastifyTypeProvider } from "fastify"
import { TypeCompiler, ValueError } from '@sinclair/typebox/compiler'
import { Static, TSchema } from '@sinclair/typebox'

export class TypeBoxValidationError extends Error {
  constructor(public readonly errors: ValueError[]) {
      super('[' + errors.map(({ path, message }) => `['${path}', '${message}']`).join(', ') + ']')
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
 export const TypeBoxValidatorCompiler: FastifySchemaCompiler<TSchema> = ({ schema }) => {
  const typeCheck = TypeCompiler.Compile(schema)
  return (value): any => {
      if (typeCheck.Check(value)) return
      // Future: Consider returning FastifySchemaValidationError[] structure instead of throw. The TypeBoxValidationError 
      // does generates human readable (and parsable) error messages, however the FastifySchemaValidationError may be a
      // better fit as it would allow Fastify to standardize on error reporting. For consideration.
      throw new TypeBoxValidationError([...typeCheck.Errors(value)])
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
  output: this['input'] extends TSchema ? Static<this['input']> : never
}
