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

The `validate` function will check the incoming request against the defined validation schemas. If the request does not comply with the schemas, it will be aborted inmediately and a `400 BAD REQUEST` response will be returned.

### Working with NEXT.js API Routes

If you are using standard NEXT.js API Routes, you may use the `validate` function to wrap your route definition and pass
along the validation schema:

```ts
import Joi from "joi";
import validate from "next-joi";

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

If your routes are powered by using a package such as `next-connect`, you can still use `validate`!
The function is ready to work as a `connect` middleware just out-of-the-box:

```ts
import Joi from "joi";
import connect from "next-connect";
import validate from "next-joi";

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

### `validate(schemas, handler)`

The `validate` function has support to check two request's fields: `query` and `body`. Independently from the route's
definition mechanism (see examples above), the first argument for this function should always be an object with the
desired validation schemas.

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
