<h1 align="center">gql-util-directives</h1>

<p align="center">
  <a href="https://github.com/thuoe/gql-util-directives/actions/workflows/ci.yml">
    <img src="https://github.com/thuoe/gql-util-directives/actions/workflows/ci.yml/badge.svg?branch=next" alt="CI status">
  </a>
</p>

<h3 align="center">
Simple utility library for custom GraphQL schema directives
</h3>

- [Get started](#get-started)
- [Local Development](#local-development)
- [Directives](#directives)
  - [@encode](#encode)
  - [@regex](#regex)
  - [@cache](#cache)
    - [Overriding in-memory cache](#overriding-in-memory-cache)

# Get started

🛠️ Work in progress

# Local Development

Install dependences via NPM:

```sh
npm install
```

Run local environment (Apollo Studio):

```sh
npm run dev
```

Link to Apollo Studio can be found on http://localhost:4000 to perform mutations and queries.

# Directives

## @encode

You can use the `@encode` directive on fields defined using the `String` scalar type.

Following encoding methods:

`ascii | utf8 | utf16le | ucs2 | base64 | base64url | latin1 | binary | hex`

```graphql
type User {
  firstName: String @encode(method: "hex")
  lastName: String @encode(method: "base64")
}
```

## @regex

You can use the `@regex` directive to validate fields using the `String` scalar type. It will throw an
`ValidationError` in the event that the pattern defined has a syntax if no matches are found against the field value.

```graphql
type User {
  firstName: String @regex(pattern: "(John|Micheal)")
  lastName: String @regex(pattern: "\\b[A-Z]\\w+\\b")
}
```

⚠️ Escaping characters

If you are defining a regex pattern using backslashes must escape them (`//`) **and** pattern invoke the function `String.raw()` to the schema so that the escape characters are not ignored:

```typescript
const typeDefs = String.raw`
  type User {
    firstName: String @regex(pattern: "(Eddie|Sam)")
    lastName: String @regex(pattern: "\\b[A-Z]\\w+\\b")
    age: Int
  }

  type Query {
    user: User
  }
`;
```

## @cache

You can use `@cache` directive to take advantage of a in-memory cache for a field value

```graphql
type Book {
  name: String
  price: String @cache(key: "book_price", ttl: 3000)
}
```

`key` - represents the unique key for field value you wish to cache

`ttl` - time-to-live argument for how long the field value should exist within the cache before expiring (in milliseconds)

### Overriding in-memory cache

If you wish to take leverage something more powerful (for example [Redis](https://redis.io/)), you can override the in-memory solution with your own implementation.

Example:

```typescript
import Redis from 'ioredis'

const redis = new Redis()
....
const cache = {
  has: (key: string) => redis.exists(key),
  get: (key: string) => redis.get(key),
  delete:(key: string) => redis.delete(key),
  set: async (key: string, value: string) => {
    await redis.set(key, value)
  },
}
...
const { cacheDirectiveTypeDefs, cacheDirectiveTransformer } = cacheDirective('cache', cache)
```

You must confirm to this set of function signatures to make this work:

- `has: (key: string) => Promise<boolean>` Checks if a key exists in the cache.
- `get: (key: string) => Promise<string>` Retrieves the value associated with a key from the cache.
- `set: (key: string, value: string) => Promise<void>` Sets a key-value pair in the cache.
- `delete: (key: string) => Promise<boolean>` Deletes a key and its associated value from the cache.
