import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import encodingDirective from '@src/directives/encode';

const typeDefs = `#graphql
  type User {
    firstName: String
    lastName: String @encode(method: "base64")
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
    })
  },
};

const { encodingDirectiveTypeDefs, encodingDirectiveTransformer } = encodingDirective('encode')

let schema = makeExecutableSchema(({
  typeDefs: [
    encodingDirectiveTypeDefs,
    typeDefs
  ],
  resolvers
}))

schema = encodingDirectiveTransformer(schema)

const server = new ApolloServer({
  schema,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`🚀  Server ready at: ${url}`);
})

