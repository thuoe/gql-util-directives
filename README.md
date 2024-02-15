<h1 align="center">gql-util-directives</h1>

<p align="center">
  <a href="https://github.com/thuoe/gql-util-directives/actions/workflows/ci.yml">
    <img src="https://github.com/thuoe/gql-util-directives/actions/workflows/ci.yml/badge.svg?branch=next" alt="CI status">
  </a>
</p>

<h3 align="center">
Simple utlity library for custom GraphQL schema directives
</h3>

- [Get started](#get-started)
- [Directives](#directives)
  - [@encode](#encode)
  - [@regex](#regex)

# Get started

🛠️ Work in progress

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
