import { MapperKind, mapSchema } from '@graphql-tools/utils'
import { fetchDirective, generateGraphQLEnum } from '@src/utils'
import { GraphQLSchema, defaultFieldResolver } from 'graphql'
import log4js from 'log4js'

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  RANDOM = 'RANDOM'
}

const logger = log4js.getLogger()

export const log = ({ message, level, toConsole }: { level: LogLevel, message: string, toConsole: boolean }) => {
  const finalLevel = level.toLocaleLowerCase()
  logger.level = finalLevel
  if (toConsole) {
    logger[finalLevel](message)
  }
}

const logDirective = (directiveName: string = 'log') => {
  return {
    logDirectiveTypeDefs: `directive @${directiveName}(level: LogLevel!) on FIELD_DEFINITION
    ${generateGraphQLEnum('LogLevel', LogLevel)}
    `,
    logDirectiveTransformer: (schema: GraphQLSchema) => mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
        const logDirective = fetchDirective<{ level: LogLevel }>(schema, fieldConfig, directiveName)
        const { resolve = defaultFieldResolver } = fieldConfig
        if (logDirective) {
          const { level } = logDirective
          return {
            ...fieldConfig,
            resolve: async (source, args, context, info) => {
              const { operation: { name } } = info
              log({ message: `Operation Name: ${name.value}`, level, toConsole: true })
              return resolve(source, args, context, info)
            }
          }
        }
      }
    })
  }
}

export default logDirective
