<h1 align="center">gql-util-directives</h1>

<h3 align="center">
Simple utlity library for custom GraphQL schema directives
</h3>

- [Get started](#get-started)
- [Directives](#directives)
  - [@encode](#encode)
  - [@regex](#regex)

# Get started

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

Under development
