'use strict'

const Builder = require('./Builder')
const Interpreter = require('./Language/Interpreter')

/**
 * SRL facade for SRL Builder and SRL Language.
 *
 * @param  {string} query
 * @return {Builder}
 */
function SRL(query) {
    return query && typeof query === 'string' ?
        new Interpreter(query).builder :
        new Builder()
}

module.exports = SRL
