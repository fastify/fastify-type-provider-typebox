# fastify-type-provider-typebox

A Type Provider for [Typebox](https://github.com/sinclairzx81/typebox)

## Installation

```sh
npm i @fastify/type-provider-typebox
```

## Usage

```ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>()
```

## Example

```ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
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

## Type definition of FastifyRequest + TypeProvider
```ts
import {
  FastifyReply,
  FastifyRequest,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';
import { Type } from '@sinclair/typebox';
import { RouteGenericInterface } from 'fastify/types/route';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export type FastifyRequestTypebox<TSchema> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  TSchema,
  TypeBoxTypeProvider
>;

export const CreateProductSchema = {
  body: Type.Object({
    name: Type.String(),
    price: Type.Number(),
  }),
};

export const CreateProductHandler = (
  req: FastifyRequestTypebox<typeof CreateProductSchema>
) => {
  // The `name` and `price` types are automatically inferred
  const { name, price } = req.body;
};
```


## Plugin definition

> **Note**
> When using plugin types, withTypeProvider is not required in order to register the plugin

```ts
import { Type } from '@sinclair/typebox';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

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
import { TypeBoxTypeProvider, TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
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
