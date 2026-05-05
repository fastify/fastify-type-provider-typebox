import { Type, FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox } from '../index.js'
import { expect } from 'tstyche';
import Fastify, { FastifyPluginAsync, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { Http2Server } from 'node:http2'

// Ensure the defaults of FastifyPluginAsyncTypebox are the same as FastifyPluginAsync
export const pluginAsyncDefaults: FastifyPluginAsync = async (fastify, options) => {
  const pluginAsyncTypeboxDefaults: FastifyPluginAsyncTypebox = async (fastifyWithTypebox, optionsTypebox) => {
    expect(fastifyWithTypebox.server).type.toBe<typeof fastify.server>()
    expect(optionsTypebox).type.toBe<typeof options>()
  }
  fastify.register(pluginAsyncTypeboxDefaults)
}

// Ensure the defaults of FastifyPluginCallbackTypebox are the same as FastifyPluginCallback
export const pluginCallbackDefaults: FastifyPluginCallback = async (fastify, options, done) => {
  const pluginCallbackTypeboxDefaults: FastifyPluginCallbackTypebox = async (fastifyWithTypebox, optionsTypebox, doneTypebox) => {
    expect(fastifyWithTypebox.server).type.toBe<typeof fastify.server>()
    expect(optionsTypebox).type.toBe<typeof options>()
  }

  fastify.register(pluginCallbackTypeboxDefaults)
}

const asyncPlugin: FastifyPluginAsyncTypebox<{ optionA: string }, Http2Server> = async (fastify, options) => {
  expect(fastify.server).type.toBe<Http2Server>()
  expect(options.optionA).type.toBe<string>()

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
}

const callbackPlugin: FastifyPluginCallbackTypebox<{ optionA: string }, Http2Server> = (fastify, options, done) => {
  expect(fastify.server).type.toBe<Http2Server>()
  expect(options.optionA).type.toBe<string>()

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
  done()
}

const fastify = Fastify()

fastify.register(asyncPlugin, {optionA: 'a'})
fastify.register(callbackPlugin, {optionA: 'a'})

const asyncPluginHttpDefault: FastifyPluginAsyncTypebox<{ optionA: string }> = async () => {
}

fp(asyncPlugin)
fp(callbackPlugin)
fp(asyncPluginHttpDefault)
