'use strict'

const Method = require('./Method')
const SyntaxException = require('../../Exceptions/Syntax')

/**
 * Method having no parameters. Will throw SyntaxException if a parameter is provided.
 */
class SimpleMethod extends Method {
    /**
     * @inheritdoc
     */
    setParameters(parameters) {
        if (parameters.length !== 0) {
            throw new SyntaxException('Invalid parameters.')
        }

        return this
    }
}

module.exports = SimpleMethod
