import { MapperKind, getDirective, mapSchema } from '@graphql-tools/utils'
import { GraphQLError, GraphQLSchema, defaultFieldResolver } from 'graphql'

const encodingDirective = (directiveName: string = 'encode') => {
  return {
    encodingDirectiveTypeDefs: `directive @${directiveName}(method: String) on FIELD_DEFINITION`,
    encodingDirectiveTransformer: (schema: GraphQLSchema) => mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: fieldConfig => {
        const encodingDirective = getDirective(schema, fieldConfig, directiveName)?.[0]
        if (encodingDirective) {
          const { method } = encodingDirective
          const { resolve = defaultFieldResolver } = fieldConfig
          return {
            ...fieldConfig,
            resolve: async (source, args, context, info) => {
              if (!Buffer.isEncoding(method)) throw new GraphQLError('Invalid Encoding Method!')
              const result = await resolve(source, args, context, info)
              if (typeof result === 'string') {
                return Buffer.from(result).toString(method)
              }
              return result
            }
          }
        }
      }
    })
  }
}

export default encodingDirective
