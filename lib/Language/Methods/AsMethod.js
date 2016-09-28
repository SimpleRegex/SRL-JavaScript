'use strict'

const Method = require('./Method')

/**
 * Method having simple parameter(s) ignoring "as".
 */
class AsMethod extends Method {
    /**
     * @inheritdoc
     */
    setParameters(parameters) {
        parameters = parameters.filter((parameter) => {
            if (typeof parameter !== 'string') {
                return true
            }

            const lower = parameter.toLowerCase()
            return lower !== 'as'
        })

        return super.setParameters(parameters)
    }
}

module.exports = AsMethod
