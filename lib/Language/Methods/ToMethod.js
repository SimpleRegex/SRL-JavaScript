'use strict'

const Method = require('./Method')

/**
 * Method having simple parameter(s) ignoring "to".
 */
class ToMethod extends Method {
    /**
     * @inheritdoc
     */
    setParameters(parameters) {
        parameters = parameters.filter((parameter) => {
            return typeof parameter !== 'string' || parameter.toLowerCase() !== 'to'
        })

        return super.setParameters(parameters)
    }
}

module.exports = ToMethod

