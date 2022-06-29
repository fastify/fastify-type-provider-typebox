import { FastifyTypeProvider } from 'fastify'

import { Static, TSchema } from '@sinclair/typebox'

export interface TypeBoxTypeProvider extends FastifyTypeProvider {
  output: this['input'] extends TSchema ? Static<this['input']> : never
}
