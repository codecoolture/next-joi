<h1 align="center">
  next-joi
</h1>

<p align="center">
  Validate NEXT.js API Routes with <em>joi</em> 😄
</p>

<p align="center">
  <img src="https://github.com/codecoolture/next-joi/workflows/test/badge.svg?branch=trunk" alt="github action badge">
</p>

- [Install](#install)
- [Getting started](#getting-started)
  - [How does it work?](#how-does-it-work)
  - [Working with NEXT.js API Routes](#working-with-nextjs-api-routes)
  - [NEXT.js & `connect`-like middlewares](#nextjs--connect-like-middlewares)
- [API](#api)
  - [`withJoi(config?) => validate`](#withjoiconfig--validate)
    - [`config`](#config)
      - [`config.onValidationError`](#configonvalidationerror)
  - [`validate(schemas, handler)`](#validateschemas-handler)
    - [`schemas`](#schemas)
      - [`schemas.body`](#schemasbody)
      - [`schemas.headers`](#schemasheaders)
      - [`schemas.query`](#schemasquery)
    - [`handler`](#handler)

## Install

```
yarn add next-joi
```

This package does not bundle with [`next.js`](https://github.com/vercel/next.js) or [`joi`](https://github.com/sideway/joi), so you will need to install them separately.

## Getting started

### How does it work?

The validation function will check the incoming request against the defined validation schemas. If the request does not comply with the schemas, it will be aborted immediately, and (by default) a `400 BAD REQUEST` response will be returned. It is possible to customize this error handling by passing a custom `onValidationError` function to the primary factory function.

**lib/middlewares/validation.ts**

```ts
import withJoi from "next-joi";

export default withJoi({
  onValidationError: (_, res) => {
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

##### `config.onValidationError`

**Required**

Custom error function to handle validation errors. It will receive the API request, response, and [validation error](https://joi.dev/api/?v=17.4.0#validationerror).

```ts
import withJoi from "next-joi";

export default withJoi({
  onValidationError: (req, res, error) => {
    res.status(400).end();
  },
});
```

### `validate(schemas, handler)`

The `validate` function has support to check the following request fields: `body`, `headers` and `query`. The first argument for this function should always be an object with the desired validation schemas.

#### `schemas`

**Required**

Even if empty, this argument is required.

##### `schemas.body`

**Optional**

A valid `joi` schema.

##### `schemas.headers`

**Optional**

> Note: since most of the time, you may receive more headers than expected, it is a good practice to make this
> schema always support [`unknown`](https://joi.dev/api/?v=17.3.0#objectunknownallow) keys. Otherwise, the validation
> will fail.

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
