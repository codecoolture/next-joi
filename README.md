<h1 align="center">
  next-joi
</h1>

<p align="center">
  Validate NEXT.js API Routes with <em>joi</em> 😄
</p>

- [Install](#install)
- [Getting started](#getting-started)
  - [How does it work?](#how-does-it-work)
  - [Working with NEXT.js API Routes](#working-with-nextjs-api-routes)
  - [NEXT.js & `connect`-like middlewares](#nextjs--connect-like-middlewares)
- [API](#api)
  - [`withJoi(config?) => validate`](#withjoiconfig--validate)
    - [`config`](#config)
      - [`config.onFailAction`](#configonfailaction)
  - [`validate(schemas, handler)`](#validateschemas-handler)
    - [`schemas`](#schemas)
      - [`schemas.body`](#schemasbody)
      - [`schemas.query`](#schemasquery)
    - [`handler`](#handler)

## Install

```
yarn add next-joi
```

This package does not bundle with [`next.js`](https://github.com/vercel/next.js) or [`joi`](https://github.com/sideway/joi), so you will need to install them separately.

## Getting started

### How does it work?

The validation function will check the incoming request against the defined validation schemas. If the request does not comply with the schemas, it will be aborted inmediately and (by default) a `400 BAD REQUEST` response will be returned. It is possible to customize this error handling by passing a custom `onFailAction` function to the primary factory function.

**lib/middlewares/validation.ts**

```ts
import withJoi from "next-joi";

export default withJoi({
  onFailAction: (_, res) => {
    return res.status(400).end();
  },
});
```

### Working with NEXT.js API Routes

If you are using standard NEXT.js API Routes, you may use the validation function to wrap your route definition and pass
along the validation schema:

```ts
import Joi from "joi";

import validate from "/lib/middlewares/validation";

const schema = Joi.object({
  birthdate: Joi.date().iso(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});

export default validate({ body: schema }, (req, res) => {
  // This function will be only executed if the incoming request complies
  // with the validation schema defined above.
});
```

### NEXT.js & `connect`-like middlewares

If your routes are powered by using a package such as `next-connect`, you can still use `next-joi`!
The middleware function is ready to work with `connect` just out-of-the-box:

```ts
import Joi from "joi";
import connect from "next-connect";

import validate from "/lib/middlewares/validation";

const schema = Joi.object({
  birthdate: Joi.date().iso(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});

export default connect().post(validate({ body: schema }), (req, res) => {
  // This function will be only executed if the incoming request complies
  // with the validation schema defined above.
}))
```

## API

### `withJoi(config?) => validate`

This factory function may optionally receive a configuration object. It will return the actual validation function (`validate`) that can be used as API route middleware.

#### `config`

**Optional**

If omitted, `next-joi` will use a default configuration.

##### `config.onFailAction`

**Required**

Custom error function to handle validation errors. It will received the API request and response.

```ts
import withJoi from "next-joi";

export default withJoi({
  onFailAction: (req, res) => {
    return res.status(400).end();
  },
});
```

### `validate(schemas, handler)`

The `validate` function has support to check two request's fields: `query` and `body`. The first argument for this function should always be an object with the desired validation schemas.

#### `schemas`

**Required**

Even if empty, this argument is required.

##### `schemas.body`

**Optional**

A valid `joi` schema.

##### `schemas.query`

**Optional**

A valid `joi` schema.

#### `handler`

**Optional**

A valid `next` API Route handler. If you are using the `validate` function without a `connect`-like middleware engine, this argument becomes mandatory.

Example:

```ts
const handler = function (req: NextApiRequest, res: NextApiResponse) {
  // implementation
};

export default validate({}, handler);
```
