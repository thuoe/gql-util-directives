import { MapperKind, mapSchema } from '@graphql-tools/utils'
import { fetchDirective, generateGraphQLEnum } from '@src/utils'
import { GraphQLSchema, defaultFieldResolver } from 'graphql'
import winston from 'winston'

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  RANDOM = 'RANDOM'
}

const customLogLevels = {
  [LogLevel.INFO]: 0,
  [LogLevel.DEBUG]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.RANDOM]: 4,
}

const logger = winston.createLogger({
  levels: customLogLevels,
})

export const log = ({ message, level }: { level: LogLevel, message: string }) => {
  logger[level](message)
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
          if (logDirective) {
            logger.configure({
              transports: [
                new winston.transports.Console({ level })
              ]
            })
            return {
              ...fieldConfig,
              resolve: async (source, args, context, info) => {
                const { operation: { name } } = info
                log({ message: `Operation name: ${name.value}`, level })
                return resolve(source, args, context, info)
              }
            }
          }
        }
      }
    })
  }
}

export default logDirective
