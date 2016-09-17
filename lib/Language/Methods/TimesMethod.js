'use strict'

const Method = require('./Method')
const SyntaxException = require('../../Exceptions/Syntax')

/**
 * Method having one or two parameters. First is simple, ignoring second "time" or "times". Will throw SyntaxException if more parameters provided.
 */
class TimeMethod extends Method {
    /**
     * @inheritdoc
     */
    setParameters(parameters) {
        parameters = parameters.filter((parameter) => {
            if (typeof parameter !== 'string') {
                return true
            }

            const lower = parameter.toLowerCase()

            return lower !== 'times' && lower !== 'time'
        })

        if (parameters.length > 1) {
            throw new SyntaxException('Invalid parameter.')
        }

        return super.setParameters(parameters)
    }
}

module.exports = TimeMethod

