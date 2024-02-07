import { MapperKind, getDirective, mapSchema } from '@graphql-tools/utils'
import { GraphQLError, GraphQLSchema, defaultFieldResolver } from 'graphql'
import ValidationError from '@src/errors'

const regexDirective = (directiveName: string) => {
  return {
    regexDirectiveTypeDefs: `directive @${directiveName}(pattern: String) on FIELD_DEFINITION`,
    regexDirectiveTransformer: (schema: GraphQLSchema) => mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: fieldConfig => {
        const regexDirective = getDirective(schema, fieldConfig, directiveName)?.[0]
        if (regexDirective) {
          const { pattern } = regexDirective
          const { resolve = defaultFieldResolver } = fieldConfig
          return {
            ...fieldConfig,
            resolve: async (source, args, context, info) => {
              try {
                const result = await resolve(source, args, context, info)
                if (typeof result === 'string') {
                  const regex = new RegExp(pattern)
                  if (result && !regex.test(result)) {
                    throw new ValidationError(`String must match pattern: "${pattern}"`)
                  }
                  return result
                }
              } catch (e) {
                if (!(e instanceof ValidationError))
                  throw new GraphQLError(`Syntax Error: "${pattern}" is not recognized as a valid pattern`)
                else {
                  throw e
                }
              }
            }
          }
        }
      }
    })
  }
}

export default regexDirective
