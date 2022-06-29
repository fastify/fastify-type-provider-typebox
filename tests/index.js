const tap = require('tap')
const Fastify = require('fastify')
const { Type } = require('@sinclair/typebox')

// Tests that Fastify accepts TypeBox schemas without explicit configuration
tap.test('should compile typebox schema without configuration', async t => {
    t.plan(1)
    const fastify = Fastify().get('/', {
        schema: {
            querystring: Type.Object({
                x: Type.Number(),
                y: Type.Number(),
                z: Type.Number()
            })
        }
    }, (_req, _res) => { })
    await fastify.listen({ port: 5000 })
    await fastify.close()
    t.pass()
})

// Tests that Fastify rejects unknown properties on the schema.
tap.test('should not compile schema with unknown keywords', async t => {
    t.plan(1)
    const fastify = Fastify().get('/', {
        schema: {
            querystring: Type.Object({
                x: Type.Number(),
                y: Type.Number(),
                z: Type.Number()
            }, { kind: 'Object' }) // unknown
        }
    }, (_req, _res) => { })
    try {
        await fastify.listen({ port: 5000 }) // expect throw
        t.fail()
    } catch {
        await fastify.close()
        t.pass()
    }
})