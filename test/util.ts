import { makeExecutableSchema } from '@graphql-tools/schema'

export const buildSchema = ({ typeDefs, resolvers, transformers }) => {
  let schema = makeExecutableSchema({
    typeDefs,
    resolvers
  })
  schema = transformers.reduce((curSchema, transformer) => transformer(curSchema), schema)
  return schema
}
