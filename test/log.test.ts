import { ApolloServer } from '@apollo/server'
import * as directive from '@src/directives/log'
import { buildSchema } from './util'
import assert from 'assert'
import path from 'path'
import fs from 'fs'

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
    jest.spyOn(directive, 'log').mockImplementation()
    jest.spyOn(directive, 'initLogger').mockImplementation((filePath) => {
      if (filePath) {
        const { dir } = path.parse(filePath)
        console.log(`Dir: ${dir}`)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }
        fs.writeFileSync(filePath, 'Simple log message')
      }
    })
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
    expect(directive.initLogger).toHaveBeenCalledTimes(1)
    expect(directive.initLogger).toHaveBeenCalledWith(undefined, directive.LogLevel.INFO)
    expect(directive.log).toHaveBeenCalled()
    expect(directive.log).toHaveBeenCalledWith({ message: 'Operation Name: TestQuery', level: directive.LogLevel.INFO })
  })

  it('can write to a log file with the preferred file name with a log level, label, timestamp & message', async () => {
    const fileName = 'test.log'
    const folderName = 'testLogs'
    const filePath = path.join(__dirname, folderName, fileName)
    const { logDirectiveTypeDefs: typeDefs, logDirectiveTransformer: transformer } = directive.default({
      filePath,
    })
    const schema = buildSchema({
      typeDefs: [
        `type User {
          age: Int @log(level: INFO)
        }

        type Query {
          user: User
        }
        `,
        typeDefs
      ],
      resolvers,
      transformers: [transformer]

    })

    testServer = new ApolloServer({ schema })

    const response = await testServer.executeOperation<{ user: { amount: string } }>({
      query: testQuery
    })

    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(directive.initLogger).toHaveBeenCalledTimes(1)
    expect(directive.initLogger).toHaveBeenCalledWith(filePath, directive.LogLevel.INFO)
  })

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
