import { ApolloServer } from '@apollo/server';
import encodingDirective from '@src/directives/encode';
import assert from 'assert';
import { buildSchema } from './util';

const { encodingDirectiveTransformer, encodingDirectiveTypeDefs } = encodingDirective('encode')

const transformers = [
  encodingDirectiveTransformer
]

const resolvers = {
  Query: {
    user: () => ({
      firstName: 'Eddie',
      lastName: 'Thuo',
    })
  },
};

describe('@encode directive', () => {
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

  test('can encode using basic Node.js encoding formats', async () => {
    const schema = buildSchema({
      typeDefs: [
        `type User {
          firstName: String @encode(method: "hex")
          lastName: String @encode(method: "base64")
        }
    
        type Query {
          user: User
        }
        `,
        encodingDirectiveTypeDefs,
      ],
      resolvers,
      transformers,
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { firstName: string, lastName: string } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data.user.firstName).toEqual(Buffer.from('Eddie').toString('hex'));
    expect(response.body.singleResult.data.user.lastName).toEqual(Buffer.from('Thuo').toString('base64'));
  });

  test('it will throw an error if the encoding method is not recognized', async () => {
    const schema = buildSchema({
      typeDefs: [
        `type User {
          firstName: String @encode(method: "blah")
          lastName: String
        }
    
        type Query {
          user: User
        }
        `,
        encodingDirectiveTypeDefs,
      ],
      resolvers,
      transformers,
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { firstName: string, lastName: string } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeDefined();
    expect(response.body.singleResult.errors[0].message).toBe('Invalid Encoding Method!');
  })
});
