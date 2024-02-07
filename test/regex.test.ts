import { ApolloServer } from '@apollo/server'
import regexDirective from '@src/directives/regex'
import { buildSchema } from './util'
import assert from 'assert';

const { regexDirectiveTypeDefs, regexDirectiveTransformer } = regexDirective('regex')

const resolvers = {
  Query: {
    user: () => ({
      firstName: 'Eddie',
      lastName: 'Thuo',
    })
  },
};

describe('@regex directive', () => {
  let testServer: ApolloServer

  const testQuery = `
  query ExampleQuery {
    user {
      firstName
      lastName
    }
  }
  `
  afterEach(async () => {
    if (testServer) {
      await testServer.stop()
    }
  })

  it('can accept a string that matches against regex pattern', async () => {
    const schema = buildSchema({
      typeDefs: [
        `type User {
          firstName: String @regex(pattern: "Eddie")
          lastName: String @regex(pattern: "Thuo")
        }
    
        type Query {
          user: User
        }
        `,
        regexDirectiveTypeDefs,
      ],
      resolvers,
      transformers: [regexDirectiveTransformer],
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { firstName: string, lastName: string } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data.user.firstName).toEqual('Eddie');
    expect(response.body.singleResult.data.user.lastName).toEqual('Thuo');
  })

  it('will throw an error if there are no matches found in the regex pattern', async () => {
    const schema = buildSchema({
      typeDefs: [
        `type User {
          firstName: String @regex(pattern: "Sam")
          lastName: String
        }
    
        type Query {
          user: User
        }
        `,
        regexDirectiveTypeDefs,
      ],
      resolvers,
      transformers: [regexDirectiveTransformer],
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { firstName: string, lastName: string } }>({
      query: testQuery
    })
    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeDefined();
    expect(response.body.singleResult.errors[0].message).toEqual('String must match pattern: "Sam"');

  })

  it('will throw an error if unable to parse regex', async () => {
    const schema = buildSchema({
      typeDefs: [
        `type User {
        firstName: String @regex(pattern: "/([a-z]+/")
        lastName: String
      }
  
      type Query {
        user: User
      }
      `,
        regexDirectiveTypeDefs,
      ],
      resolvers,
      transformers: [regexDirectiveTransformer],
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { firstName: string, lastName: string } }>({
      query: testQuery
    })
    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeDefined();
    expect(response.body.singleResult.errors[0].message).toEqual('Syntax Error: "/([a-z]+/" is not recognized as a valid pattern');

  })
})
