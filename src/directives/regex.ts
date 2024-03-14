import { MapperKind, mapSchema } from '@graphql-tools/utils'
import { GraphQLError, GraphQLSchema, defaultFieldResolver, isScalarType } from 'graphql'
import ValidationError from '@src/errors'
import { fetchDirective } from '@src/utils'

const regexDirective = (directiveName: string = 'regex') => {
  return {
    regexDirectiveTypeDefs: `directive @${directiveName}(pattern: String) on FIELD_DEFINITION`,
    regexDirectiveTransformer: (schema: GraphQLSchema) => mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: fieldConfig => {
        const regexDirective = fetchDirective<{ pattern: string }>(schema, fieldConfig, directiveName)
        if (regexDirective && isScalarType(fieldConfig.type)) {
          const { pattern } = regexDirective
          const { resolve = defaultFieldResolver } = fieldConfig
          return {
            ...fieldConfig,
            resolve: async (source, args, context, info) => {
              try {
                const { fieldName, returnType } = info
                const type = returnType.toString()
                if (type !== 'String') {
                  throw new ValidationError(`Unable to validate field "${fieldName}" of type ${type}. @regex directive can only be used on scalar type String`)
                }
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
