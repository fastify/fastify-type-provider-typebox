# fastify-type-provider-typebox

A Type Provider for [Typebox](https://github.com/sinclairzx81/typebox)

## Installation

```sh
npm i @sinclair/typebox # Required as peer dependency
npm i @fastify/type-provider-typebox
```

## Overview

This package provides enhanced support for TypeBox by integrating it with the Fastify [Type Provider](https://www.fastify.io/docs/latest/Reference/Type-Providers/) infrastructure. It provides a re-export of the TypeBox `Type.*` builder for convenience as well as providing additional utility types and optional validation infrastructure that can be useful when leveraging TypeBox with Fastify.

## Usage

```ts
import Fastify from 'fastify'
import { Type, TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>()
```

Note that the following will not work:

```ts
import Fastify from 'fastify'
import { Type, TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const fastify = Fastify()

fastify.withTypeProvider<TypeBoxTypeProvider>()
```

## Example

```ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

// This package re-export Typebox package
// but you can also use any builders imported 
// directly from @sinclair/typebox
import { Type } from '@sinclair/typebox'


const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>()

fastify.get('/', {
  schema: {
    body: Type.Object({
      x: Type.String(),
      y: Type.Number(),
      z: Type.Boolean()
    })
  }
}, (req) => {
  // The `x`, `y`, `z` types are automatically inferred
  const { x, y, z } = req.body
})
```

## Type definition of FastifyRequest & FastifyReply + TypeProvider
```ts
import {
  FastifyReply,
  FastifyRequest,
  RawRequestDefaultExpression,
  RawServerDefault,
  RawReplyDefaultExpression,
  ContextConfigDefault
} from 'fastify';
import { RouteGenericInterface } from 'fastify/types/route';
import { FastifySchema } from 'fastify/types/schema';
import { Type, TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export type FastifyRequestTypebox<TSchema extends FastifySchema> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  TSchema,
  TypeBoxTypeProvider
>;

export type FastifyReplyTypebox<TSchema extends FastifySchema> = FastifyReply<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  RouteGenericInterface,
  ContextConfigDefault,
  TSchema,
  TypeBoxTypeProvider
>

export const CreateProductSchema = {
  body: Type.Object({
    name: Type.String(),
    price: Type.Number(),
  }),
  response: {
    201: Type.Object({
      id: Type.Number(),
    }),
  },
};

export const CreateProductHandler = (
  req: FastifyRequestTypebox<typeof CreateProductSchema>,
  reply: FastifyReplyTypebox<typeof CreateProductSchema>
) => {
  // The `name` and `price` types are automatically inferred
  const { name, price } = req.body;

  // The response body type is automatically inferred
  reply.status(201).send({ id: 'string-value' });
  //                       ^? error TS2322: Type 'string' is not assignable to type 'number'.
};
```


## Plugin definition

> **Note**
> When using plugin types, withTypeProvider is not required in order to register the plugin

```ts
import { Type, FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

const plugin: FastifyPluginAsyncTypebox = async function(fastify, _opts) {
  fastify.get('/', {
    schema: {
      body: Type.Object({
        x: Type.String(),
        y: Type.Number(),
        z: Type.Boolean()
      })
    }
  }, (req) => {
    /// The `x`, `y`, and `z` types are automatically inferred
    const { x, y, z } = req.body
  });
}
```

## Type Compiler

TypeBox provides an optional type compiler that perform very fast runtime type checking for data received on routes. Note this compiler is limited to types expressable through the TypeBox `Type.*` namespace only. To enable this compiler, you can call `.setValidatorCompiler(...)` with the `TypeBoxValidatorCompiler` export provided by this package.

```ts
import { Type, TypeBoxTypeProvider, TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox'
import Fastify from 'fastify'

const fastify = Fastify().setValidatorCompiler(TypeBoxValidatorCompiler)

fastify.withTypeProvider<TypeBoxTypeProvider>().get('/', {
  schema: {
    querystring: Type.Object({
      x: Type.String(),
      y: Type.String(),
      z: Type.String()
    })
  }
}, (req) => {
  const { x, y, z } = req.query
})
```

For additional information on this compiler, please refer to the TypeBox documentation located [here](https://github.com/sinclairzx81/typebox#Compiler)
