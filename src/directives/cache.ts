import { MapperKind, getDirective, mapSchema } from '@graphql-tools/utils'
import { GraphQLSchema, defaultFieldResolver } from 'graphql'

interface CachingImpl {
  has: (key: string) => Promise<boolean>
  get: (key: string) => Promise<string>
  set: (key: string, value: string) => Promise<void>
  delete: (key: string) => Promise<boolean>
}

const map = new Map<string, string>()

const inMemoryCache: CachingImpl = {
  has: (key: string) => Promise.resolve(map.has(key)),
  get: (key: string) => Promise.resolve(map.get(key)),
  delete: (key: string) => Promise.resolve(map.delete(key)),
  set: async (key: string, value: string) => {
    Promise.resolve(map.set(key, value))
  },
}

const cacheDirective = (directiveName: string, cache: CachingImpl = inMemoryCache) => {
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
              const exists = await cache.has(key)
              if (exists) {
                const value = await cache.get(key)
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
              setTimeout(async () => {
                await cache.delete(key)
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
