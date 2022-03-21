# fastify-type-provider-typebox

A Type Provider for [Typebox](https://github.com/sinclairzx81/typebox)

## Installation

```sh
npm install @fastify/type-provider-typebox --save
```

## Usage

```ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>()
```

**Note**: For [ajv] version 7 and above is required to use the `ajvTypeBoxPlugin`:

```ts
import Fastify from 'fastify'
import { ajvTypeBoxPlugin, TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const fastify = Fastify({
  ajv: {
    plugins: [ajvTypeBoxPlugin]
  }
}).withTypeProvider<TypeBoxTypeProvider>()
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
