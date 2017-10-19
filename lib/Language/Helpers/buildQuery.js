'use strict'

const Method = require('../Methods/Method')
const Builder = require('../../Builder')
const NonCapture = require('../../Builder/NonCapture')
const SyntaxException = require('../../Exceptions/Syntax')

/**
 * After the query was resolved, it can be built and thus executed.
 *
 * @param array $query
 * @param Builder|null $builder If no Builder is given, the default Builder will be taken.
 * @return Builder
 * @throws SyntaxException
 */
function buildQuery(query, builder = new Builder()) {
    for (let i = 0; i < query.length; i++) {
        const method = query[i]

        if (Array.isArray(method)) {
            builder.and(buildQuery(method, new NonCapture()))
            continue
        }

        if (!method instanceof Method) {
            // At this point, there should only be methods left, since all parameters are already taken care of.
            // If that's not the case, something didn't work out.
            throw new SyntaxException(`Unexpected statement: ${method}`)
        }

        const parameters = []
        // If there are parameters, walk through them and apply them if they don't start a new method.
        while (query[i + 1] && !(query[i + 1] instanceof Method)) {
            parameters.push(query[i + 1])

            // Since the parameters will be appended to the method object, they are already parsed and can be
            // removed from further parsing. Don't use unset to keep keys incrementing.
            query.splice(i + 1, 1)
        }

        try {
            // Now, append that method to the builder object.
            method.setParameters(parameters).callMethodOn(builder)
        } catch (e) {
            const lastIndex = parameters.length - 1
            if (Array.isArray(parameters[lastIndex])) {
                if (lastIndex !== 0) {
                    method.setParameters(parameters.slice(0, lastIndex))
                }
                method.callMethodOn(builder)
                builder.and(buildQuery(parameters[lastIndex], new NonCapture()))
            } else {
                throw new SyntaxException(`Invalid parameter given for ${method.origin}`)
            }
        }
    }

    return builder
}

module.exports = buildQuery
