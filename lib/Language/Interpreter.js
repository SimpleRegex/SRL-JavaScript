'use strict'

const Cache = require('./Helpers/Cache')
const Literally = require('./Helpers/Literally')
const parseParentheses = require('./Helpers/parseParentheses')
const buildQuery = require('./Helpers/buildQuery')
const methodMatch = require('./Helpers/methodMatch')

const InterpreterException = require('../Exceptions/Interpreter')

class Interpreter {
    /**
     * @constructor
     * @param  {string} query
     */
    constructor(query) {
        const rawQuery = this.rawQuery = query.trim().replace(/\s*;$/, '')

        if (Cache.has(rawQuery)) {
            this.builder = Cache.get(rawQuery).clone()
        } else {
            this.build()
        }
    }

    /**
     * Resolve and then build the query.
     */
    build() {
        this.resolvedQuery = this.resolveQuery(parseParentheses(this.rawQuery))

        this.builder = buildQuery(this.resolvedQuery)

        // Add built query to cache, to avoid rebuilding the same query over and over.
        Cache.set(this.rawQuery, this.builder)
    }

    /**
     * Resolve the query array recursively and insert Methods.
     *
     * @param array $query
     * @return array
     * @throws InterpreterException
     */
    resolveQuery(query) {
        // Using for, since the array will be altered. Foreach would change behaviour.
        for (let i = 0; i < query.length; i++) {
            let item = query[i]

            if (typeof item === 'string') {
                // Remove commas and remove item if empty.
                item = query[i] = item.replace(/,/g, ' ')

                if (item === '') {
                    continue
                }

                try {
                    // A string can be interpreted as a method. Let's try resolving the method then.
                    const method = methodMatch(item.trim())

                    // If anything was left over (for example parameters), grab them and insert them.
                    const leftOver = item.replace(new RegExp(method.origin, 'i'), '')
                    query[i] = method
                    if (leftOver !== '') {
                        query.splice(i + 1, 0, leftOver.trim())
                    }
                } catch (e) {
                    // There could be some parameters, so we'll split them and try to parse them again
                    const matches = item.match(/(.*?)[\s]+(.*)/)

                    if (matches) {
                        query[i] = matches[1].trim()

                        if (matches[2]) {
                            query.splice(i + 1, 0, matches[2].trim())
                        }
                    }
                }
            } else if (Array.isArray(item)) {
                query[i] = this.resolveQuery(item)
            } else if (!item instanceof Literally) {
                throw new InterpreterException(`Unexpected statement: ${JSON.stringify(item)}`)
            }
        }

        return query.filter((item) => item !== '')
    }

    /**
     * Return the built RegExp object.
     *
     * @return {RegExp}
     */
    get() {
        return this.builder.get()
    }
}

module.exports = Interpreter
