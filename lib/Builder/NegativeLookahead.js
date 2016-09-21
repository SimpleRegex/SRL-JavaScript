'use strict'

const Builder = require('../Builder')

class NegativeLookahead extends Builder {
    constructor() {
        super()

        /** @var {string} _group Desired lookahead group. */
        this._group = '(?!%s)'
    }
}

module.exports = NegativeLookahead
