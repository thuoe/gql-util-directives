import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import encodingDirective from '@src/directives/encode';
import regexDirective from '@src/directives/regex';

const typeDefs = String.raw`#graphql
  type User {
    firstName: String @regex(pattern: "Eddie")
    lastName: String @encode(method: "base64")
    age: Int @regex(pattern: "28")
  }

  type Query {
    user: User
  }
`;

const resolvers = {
  Query: {
    user: () => ({
      firstName: 'Eddie',
      lastName: 'Thuo',
      age: 28,
    })
  },
};

const { encodingDirectiveTypeDefs, encodingDirectiveTransformer } = encodingDirective('encode')
const { regexDirectiveTypeDefs, regexDirectiveTransformer } = regexDirective('regex')

const transformers = [
  encodingDirectiveTransformer,
  regexDirectiveTransformer,
]

let schema = makeExecutableSchema(({
  typeDefs: [
    encodingDirectiveTypeDefs,
    regexDirectiveTypeDefs,
    typeDefs
  ],
  resolvers
}))

schema = transformers.reduce((curSchema, transformer) => transformer(curSchema), schema)

const server = new ApolloServer({
  schema,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`🚀  Server ready at: ${url}`);
})

