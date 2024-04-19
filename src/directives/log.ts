import { MapperKind, mapSchema } from '@graphql-tools/utils'
import { fetchDirective, generateGraphQLEnum } from '@src/utils'
import { GraphQLSchema, defaultFieldResolver } from 'graphql'
import log4js, { type Logger } from 'log4js'

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  RANDOM = 'RANDOM'
}

type DirectiveParams = {
  directiveName?: string
  filePath?: string
}

let logger: Logger

export const log = ({ message, level }: { level: LogLevel, message: string }) => {
  const finalLevel = level.toLocaleLowerCase()
  logger.level = finalLevel
  logger[finalLevel](message)
}

export const initLogger = (filePath: string, level: LogLevel) => {
  if (filePath) {
    log4js.configure({
      appenders: {
        app: { type: 'file', filename: filePath },
      },
      categories: {
        default: { appenders: ['app'], level: level.toLowerCase() },
      },
    })
  }
  logger = log4js.getLogger()
}

const logDirective = ({ directiveName = 'log', filePath }: DirectiveParams = {}) => {
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
          if (!log4js.isConfigured()) {
            initLogger(filePath, level)
          }
          return {
            ...fieldConfig,
            resolve: async (source, args, context, info) => {
              const { operation: { name } } = info
              log({ message: `Operation Name: ${name.value}`, level })
              return resolve(source, args, context, info)
            }
          }
        }
      }
    })
  }
}

export default logDirective
