import cacheDirective from '@src/directives/cache'
import encodingDirective from '@src/directives/encode'
import regexDirective from '@src/directives/regex'
import currencyDirective from '@src/directives/currency'
import logDirective from '@src/directives/log'

const directives = Object.freeze({
  cacheDirective,
  currencyDirective,
  encodingDirective,
  regexDirective,
  logDirective,
})

export default directives
