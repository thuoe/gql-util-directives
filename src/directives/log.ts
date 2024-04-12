import { MapperKind, mapSchema } from '@graphql-tools/utils'
import { fetchDirective, generateGraphQLEnum } from '@src/utils'
import { GraphQLSchema, defaultFieldResolver } from 'graphql'
import winston from 'winston'

export enum LogLevel {
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

export const log = ({ message, level, toConsole }: { level: LogLevel, message: string, toConsole: boolean }) => {
  if (toConsole) {
    logger.configure({
      transports: [
        new winston.transports.Console({ level })
      ]
    })
    logger[level](message)
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
