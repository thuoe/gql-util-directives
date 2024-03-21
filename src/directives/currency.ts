import { fetchDirective } from '@src/utils'
import { MapperKind, mapSchema } from '@graphql-tools/utils'
import { GraphQLError, GraphQLSchema, defaultFieldResolver } from 'graphql'
import * as cheerio from 'cheerio'

type CurrencyDirectiveArgs = {
  from: string
  to: string
}

const currencyDirective = (directiveName: string = 'currency') => {
  return {
    currencyDirectiveTypeDefs: `directive @${directiveName}(from: String!, to: String!) on FIELD_DEFINITION`,
    currencyDirectiveTransformer: (schema: GraphQLSchema) => mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
        const currencyDirective = fetchDirective<CurrencyDirectiveArgs>(schema, fieldConfig, directiveName)
        if (currencyDirective) {
          const { from, to } = currencyDirective
          const { resolve = defaultFieldResolver } = fieldConfig
          return {
            ...fieldConfig,
            resolve: async (source, args, context, info) => {
              const { fieldName, returnType } = info
              const type = returnType.toString()
              if (type !== 'String') {
                throw new GraphQLError(`Unable to validate field "${fieldName}" of type ${type}. @currency directive can only be used on scalar type String`)
              }
              const value = await resolve(source, args, context, info)
              try {
                const response = await fetch(`https://www.google.com/search?q=${value}+${from}+to+${to}+&hl=en`)
                const html = await response.text()
                const $ = cheerio.load(html)
                const $input = $('.iBp4i') // TODO: hacky... find better selector
                return $input.text().split(' ')[0]
              } catch (error) {
                throw new GraphQLError(`Error converting amount ${value} from ${from} to ${to}!`, error)
              }
            }
          }

        }
      }
    })
  }
}

export default currencyDirective
