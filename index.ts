import { FastifyTypeProvider } from 'fastify'

import { Static, TSchema } from '@sinclair/typebox'

export interface TypeBoxTypeProvider extends FastifyTypeProvider {
  output: this['input'] extends TSchema ? Static<this['input']> : never
}

export const ajvTypeBoxPlugin = function (ajv: any): void {
  ajv.addKeyword({ keyword: 'kind' })
  ajv.addKeyword({ keyword: 'modifier' })
}
