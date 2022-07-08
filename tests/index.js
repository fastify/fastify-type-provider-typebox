const tap = require('tap')
const Fastify = require('fastify')
const { Type } = require('@sinclair/typebox')
const { TypeBoxValidatorCompiler } = require('../dist/index')
const fetch = require('node-fetch')

// This test ensures AJV ignores the TypeBox [Kind] symbol property in strict
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

// This test ensures AJV internally throws for unknown schema properties in strict
tap.test('should not compile schema with unknown keywords', async t => {
    t.plan(1)
    const fastify = Fastify().get('/', {
        schema: {
            querystring: Type.Object({
                x: Type.Number(),
                y: Type.Number(),
                z: Type.Number()
            }, { kind: 'Object' }) // unknown keyword
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

tap.test('should validate querystring parameters', async t => {
    t.plan(1)
    const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
        schema: {
            querystring: Type.Object({
                a: Type.String(),
                b: Type.String(),
                c: Type.String()
            })
        }
    }, (req, res) => res.send(req.query))
    await fastify.listen({ port: 5000 })
    const { a, b, c } = await fetch('http://localhost:5000/?a=1&b=2&c=3').then(res => res.json())
    if(a === '1' && b === '2' & c === '3') {
        t.pass()
    } else {
        t.fail()
    }
    await fastify.close()
})

tap.test('should not validate querystring parameters', async t => {
    t.plan(1)
    const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler).get('/', {
        schema: {
            querystring: Type.Object({
                a: Type.String(),
                b: Type.String(),
                c: Type.String()
            })
        }
    }, (req, res) => res.send(req.query))
    await fastify.listen({ port: 5000 })
    const status = await fetch('http://localhost:5000/?a=1&b=2').then(res => res.status)
    if(status !== 500) {
        t.fail()
    } else {
        t.pass()
    }
    await fastify.close()
})