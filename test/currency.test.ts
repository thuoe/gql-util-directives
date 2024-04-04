import assert from 'assert'
import * as directive from '@src/directives/currency'
import { ApolloServer } from '@apollo/server'
import { buildSchema } from './util'
import { CurrencyCode } from '@src/types'

const { currencyDirectiveTypeDefs, currencyDirectiveTransformer } = directive.default()

describe('@currency directive', () => {
  const amount = 100
  const finalAmount = '125.3'
  let testServer: ApolloServer

  const resolvers = {
    Query: {
      user: () => ({
        amount
      })
    }
  }

  const testQuery = `
  query TestQuery {
    user {
      amount
    }
  }
  `
  beforeEach(() => {
    jest.spyOn(directive, 'fetchAmount').mockImplementation(() => Promise.resolve(finalAmount))
  })

  afterEach(async () => {
    if (testServer) {
      await testServer.stop()
    }
    jest.restoreAllMocks()
  })

  it('will convert from one currency to another by fetching from URL', async () => {
    const from = CurrencyCode.GBP
    const to = CurrencyCode.USD
    const schema = buildSchema({
      typeDefs: [
        `type User {
          amount: String @currency(from: ${from}, to: ${to})
        }

        type Query {
          user: User
        }
        `,
        currencyDirectiveTypeDefs
      ],
      resolvers,
      transformers: [currencyDirectiveTransformer]
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { amount: string } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data.user.amount).toBe(finalAmount)
    expect(directive.fetchAmount).toHaveBeenCalled()
    expect(directive.fetchAmount).toHaveBeenLastCalledWith({ originalAmount: amount, to, from })
  })

  it('will throw an error if currency code(s) are not recognized', async () => {
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
          currencyDirectiveTypeDefs
        ],
        resolvers,
        transformers: [currencyDirectiveTransformer]
      })

    expect(buildFaultySchema).toThrow()
  })
})
