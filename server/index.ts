import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import encodingDirective from '@src/directives/encode';
import regexDirective from '@src/directives/regex';
import cacheDirective from '@src/directives/cache';
import currencyDirective from '@src/directives/currency';
import logDirective from '@src/directives/log';

const typeDefs = String.raw`#graphql
  type User {
    firstName: String @regex(pattern: "(Eddie|Sam)")
    lastName: String @regex(pattern: "\\b[A-Z]\\w+\\b")
    age: Int @cache(key: "user_age", ttl: 3000)
    amount: String @currency(from: GBP, to: USD)
  }

  type Query {
    user: User @log(level: INFO)
  }
`;

const resolvers = {
  Query: {
    user: () => ({
      firstName: 'Eddie',
      lastName: 'Thuo',
      age: 28,
      amount: '100',
    })
  },
};

const { encodingDirectiveTypeDefs, encodingDirectiveTransformer } = encodingDirective()
const { regexDirectiveTypeDefs, regexDirectiveTransformer } = regexDirective()
const { cacheDirectiveTypeDefs, cacheDirectiveTransformer } = cacheDirective()
const { currencyDirectiveTypeDefs, currencyDirectiveTransformer } = currencyDirective()
const { logDirectiveTypeDefs, logDirectiveTransformer } = logDirective()

const transformers = [
  encodingDirectiveTransformer,
  regexDirectiveTransformer,
  cacheDirectiveTransformer,
  currencyDirectiveTransformer,
  logDirectiveTransformer,
]

let schema = makeExecutableSchema(({
  typeDefs: [
    encodingDirectiveTypeDefs,
    regexDirectiveTypeDefs,
    cacheDirectiveTypeDefs,
    currencyDirectiveTypeDefs,
    logDirectiveTypeDefs,
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

