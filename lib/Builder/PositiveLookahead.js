'use strict'

const Builder = require('../Builder')

class PositiveLookahead extends Builder {
    constructor() {
        super()

        /** @var {string} _group Desired match group. */
        this._group = '(?=%s)'
    }
}

module.exports = PositiveLookahead
