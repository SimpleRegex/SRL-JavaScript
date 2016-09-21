'use strict'

const Builder = require('../Builder')

class Optional extends Builder {
    constructor() {
        super()

        /** @var {string} _group Desired match group. */
        this._group = '(?:%s)?'
    }
}

module.exports = Optional
