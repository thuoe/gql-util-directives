import { GraphQLError } from 'graphql'

class ValidationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'REGEX_VALIDATION_FAILED',
      }
    })
  }
}

export default ValidationError
