'use strict'

const Method = require('./Method')

/**
 * Method having simple parameter(s) ignoring "and" and "times".
 */
class AndMethod extends Method {
    /**
     * @inheritdoc
     */
    setParameters(parameters) {
        parameters = parameters.filter((parameter) => {
            if (typeof parameter !== 'string') {
                return true
            }

            const lower = parameter.toLowerCase()
            return lower !== 'and' && lower !== 'times' && lower !== 'time'
        })

        return super.setParameters(parameters)
    }
}

module.exports = AndMethod
