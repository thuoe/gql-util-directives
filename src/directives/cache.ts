import { MapperKind, getDirective, mapSchema } from '@graphql-tools/utils'
import { GraphQLSchema, defaultFieldResolver } from 'graphql'

interface CachingImpl {
  has: (key: string) => boolean
  get: (key: string) => string
  set: (key: string, value: string) => void
  delete: (key: string) => boolean
}

const cacheDirective = (directiveName: string, cache: CachingImpl = new Map<string, string>()) => {
  return {
    cacheDirectiveTypeDefs: `directive @${directiveName}(key: String, ttl: Int) on FIELD_DEFINITION`,
    cacheDirectiveTransformer: (schema: GraphQLSchema) => mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: fieldConfig => {
        const { resolve = defaultFieldResolver } = fieldConfig
        const cacheDirective = getDirective(schema, fieldConfig, directiveName)?.[0]
        if (cacheDirective) {
          const { ttl, key } = cacheDirective
          return {
            ...fieldConfig,
            resolve: async (source, args, context, info) => {
              const { returnType } = info
              if (cache.has(key)) {
                const value = cache.get(key)
                if (returnType.toString() === 'string') {
                  return value
                }
                if (returnType.toString() === 'boolean') {
                  const boolValue = (/true/).test(value);
                  return boolValue
                }
                if (returnType.toString() === 'Int') {
                  return Number(value)
                }
              }
              const result = await resolve(source, args, context, info)
              cache.set(key, JSON.stringify(result))
              setTimeout(() => {
                cache.delete(key)
              }, ttl)
              return result
            }
          }
        }
      }
    }
    )
  }
}

export default cacheDirective
