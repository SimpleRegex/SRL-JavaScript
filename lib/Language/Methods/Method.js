'use strict'

const SyntaxException = require('../../Exceptions/Syntax')
const ImplementationException = require('../../Exceptions/Implementation')

const Literally = require('../Helpers/Literally')

class Method {
    /**
     * @constructor
     * @param  {string} origin
     * @param  {string} methodName
     * @param  {function} buildQuery
     */
    constructor(origin, methodName, buildQuery) {
        /** @var {string} origin Contains the original method name (case-sensitive). */
        this.origin = origin
        /** @var {string} methodName Contains the method name to execute. */
        this.methodName = methodName

        /** @var {array} parameters Contains the parsed parameters to pass on execution. */
        this.parameters = []
        /** @var {array} executedCallbacks Contains all executed callbacks for that method. Helps finding "lost" groups. */
        this.executedCallbacks = []

        /** @var {function} buildQuery Reference to buildQuery since js DON'T support circular dependency well */
        this.buildQuery = buildQuery
    }

    /**
     * @param  {Builder} builder
     * @throws {SyntaxException}
     * @return {Builder|mixed}
     */
    callMethodOn(builder) {
        const methodName = this.methodName
        const parameters = this.parameters

        try {
            builder[methodName].apply(builder, parameters)

            parameters.forEach((parameter, index) => {
                if (
                    typeof parameter === 'function' &&
                    !this.executedCallbacks.includes(index)
                ) {
                    // Callback wasn't executed, but expected to. Assuming parentheses without method, so let's "and" it.
                    builder.group(parameter)
                }
            })
        } catch (e) {
            if (e instanceof ImplementationException) {
                throw new SyntaxException(e.message)
            } else {
                throw new SyntaxException(`'${methodName}' does not allow the use of sub-queries.`)
            }
        }
    }

    /**
     * Set and parse raw parameters for method.
     *
     * @param  {array} params
     * @throws {SyntaxException}
     * @return {Method}
     */
    setParameters(parameters) {
        this.parameters = parameters.map((parameter, index) => {
            if (parameter instanceof Literally) {
                return parameter.toString()
            } else if (Array.isArray(parameter)) {
                // Assuming the user wanted to start a sub-query. This means, we'll create a callback for them.
                return (builder) => {
                    this.executedCallbacks.push(index)
                    this.buildQuery(parameter, builder)
                }
            } else {
                return parameter
            }
        })

        return this
    }
}

module.exports = Method
