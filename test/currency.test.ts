import { ApolloServer } from '@apollo/server'
import currencyDirective from '@src/directives/currency'
import { buildSchema } from './util'
import assert from 'assert'

const { currencyDirectiveTypeDefs, currencyDirectiveTransformer } = currencyDirective()

describe('@currency directive', () => {
  const amount = 100
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

  afterEach(async () => {
    if (testServer) {
      await testServer.stop()
    }
    jest.restoreAllMocks()
  })

  it('will convert from one currency to another by fetching from URL', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    const from = 'GBP'
    const to = 'USD'
    const schema = buildSchema({
      typeDefs: [
        `type User {
          amount: String @currency(from: "${from}", to: "${to}")
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
    expect(fetchSpy).toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledWith(`https://www.google.com/search?q=${amount}+${from}+to+${to}+&hl=en`)
  })
  it.todo('will convert from one currency to another and return a integer')
  it.todo('will convert from one currency to another and format with a seperator')
  it.todo('will throw an error if currency code is not recognized')
})
