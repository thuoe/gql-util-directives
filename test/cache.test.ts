import { ApolloServer } from '@apollo/server';
import cacheDirective from '@src/directives/cache';
import { buildSchema } from './util';
import assert from 'assert';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

const cache = new Map<string, string>()

const cacheCallback = {
  has: jest.fn(key => cache.has(key)),
  get: jest.fn(key => cache.get(key)),
  delete: jest.fn(key => cache.delete(key)),
  set: jest.fn((key: string, value: string) => {
    cache.set(key, value)
  }),
}

const { cacheDirectiveTypeDefs, cacheDirectiveTransformer } = cacheDirective('cache', cacheCallback)

describe('@cache directive', () => {
  let testServer: ApolloServer;

  const resolvers = {
    Query: {
      user: () => ({
        age: 28
      })
    },
  };

  const testQuery = `
  query ExampleQuery {
    user {
      age
    }
  }
  `

  afterEach(async () => {
    if (testServer) {
      await testServer.stop()
    }
  })

  it('will cache a field value before returning a response with correct ttl', async () => {
    const ttl = 8000
    const schema = buildSchema({
      typeDefs: [
        `type User {
          age: Int @cache(key: "user_age", ttl: ${ttl})
        }
    
        type Query {
          user: User
        }
        `,
        cacheDirectiveTypeDefs,
      ],
      resolvers,
      transformers: [cacheDirectiveTransformer],
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { age: number } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data.user.age).toEqual(28);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), ttl);
    expect(cacheCallback.set).toHaveBeenCalled()
  })

  it('will delete a cache field value if the ttl has long expired', async () => {
    const ttl = 3000
    const key = 'user_age'
    const schema = buildSchema({
      typeDefs: [
        `type User {
          age: Int @cache(key: "${key}", ttl: ${ttl})
        }
    
        type Query {
          user: User
        }
        `,
        cacheDirectiveTypeDefs,
      ],
      resolvers,
      transformers: [cacheDirectiveTransformer],
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { age: number } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data.user.age).toEqual(28);

    expect(cacheCallback.set).toHaveBeenCalled()
    expect(cacheCallback.set).toHaveBeenCalledWith(key, JSON.stringify(response.body.singleResult.data.user.age))

    jest.advanceTimersByTime(ttl + 5000)

    expect(cacheCallback.delete).toHaveBeenCalled()
    expect(cacheCallback.delete).toHaveBeenCalledWith(key)
  })
})
