import { ApolloServer } from '@apollo/server'
import * as directive from '@src/directives/log'
import { buildSchema } from './util'
import assert from 'assert'

const { logDirectiveTypeDefs, logDirectiveTransformer } = directive.default()

describe('@log directive', () => {
  let testServer: ApolloServer

  const resolvers = {
    Query: {
      user: () => ({
        age: 28
      })
    }
  }

  const testQuery = `
  query TestQuery {
    user {
      age
    }
  }
  `
  beforeEach(() => {
    jest.spyOn(directive, 'log')
  })

  afterEach(async () => {
    if (testServer) {
      await testServer.stop()
    }
    jest.restoreAllMocks()
  })

  it('can write to a console', async () => {
    const schema = buildSchema({
      typeDefs: [
        `type User {
          age: Int @log(level: INFO)
        }

        type Query {
          user: User
        }
        `,
        logDirectiveTypeDefs
      ],
      resolvers,
      transformers: [logDirectiveTransformer]
    })
    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { amount: string } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(directive.log).toHaveBeenCalled()
  })

  it.todo('can write to a log file with the preferred file name with a log level, label, timestamp & message')

  it('will throw error if the log level is not recognzied', () => {
    const buildFaultySchema = () =>
      buildSchema({
        typeDefs: [
          `
          type User {
            amount: String @currency(from: BOB, to: CAT)
          }
          
          type Query {
            user: User
          }
        `,
          logDirectiveTypeDefs
        ],
        resolvers,
        transformers: [logDirectiveTransformer]
      })

    expect(buildFaultySchema).toThrow()
  })

})
