import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import encodingDirective from '@src/directives/encode';
import regexDirective from '@src/directives/regex';
import cacheDirective from '@src/directives/cache';
import currencyDirective from '@src/directives/currency';
import logDirective from '@src/directives/log';
import path from 'path';

const typeDefs = String.raw`#graphql
  type User {
    firstName: String @regex(pattern: "(Eddie|Sam)")
    lastName: String @regex(pattern: "\\b[A-Z]\\w+\\b")
    age: Int @cache(key: "user_age", ttl: 3000)
    amount: String @currency(from: GBP, to: USD)
  }

  type Query {
    user(firstName: String!): User @log(level: INFO)
  }
`;

const demoUser = {
  firstName: 'Eddie',
  lastName: 'Thuo',
  age: 28,
  amount: '100',
}

const resolvers = {
  Query: {
    user: (parent, args) => {
      const { firstName } = args
      if (demoUser.firstName === firstName) {
        return demoUser
      }
      return {}
    }
  },
};

const { encodingDirectiveTypeDefs, encodingDirectiveTransformer } = encodingDirective()
const { regexDirectiveTypeDefs, regexDirectiveTransformer } = regexDirective()
const { cacheDirectiveTypeDefs, cacheDirectiveTransformer } = cacheDirective()
const { currencyDirectiveTypeDefs, currencyDirectiveTransformer } = currencyDirective()
const { logDirectiveTypeDefs, logDirectiveTransformer } = logDirective({
  filePath: path.join(__dirname, 'logs', 'application.log')
})

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

