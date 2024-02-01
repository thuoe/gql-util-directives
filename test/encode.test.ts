import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import encodingDirective from '@src/directives/encode';
import assert from 'assert';

const { encodingDirectiveTransformer, encodingDirectiveTypeDefs } = encodingDirective('encode')

const directiveTransformers = [
  encodingDirectiveTransformer
]

const buildSchema = ({ typeDefs, resolvers }) => {
  let schema = makeExecutableSchema({
    typeDefs,
    resolvers
  })
  schema = directiveTransformers.reduce((curSchema, transformer) => transformer(curSchema), schema)
  return schema
}

const resolvers = {
  Query: {
    user: () => ({
      firstName: 'Eddie',
      lastName: 'Thuo',
    })
  },
};

describe('@thuoe/util-schema-directives', () => {
  let testServer: ApolloServer

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
    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { firstName: string, lastName: string } }>({
      query: `
      query ExampleQuery {
        user {
          firstName
          lastName
        }
      }
      `
    })

    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data.user.firstName).toEqual(Buffer.from('Eddie').toString('hex'));
    expect(response.body.singleResult.data.user.lastName).toEqual(Buffer.from('Thuo').toString('base64'));
  });
});
