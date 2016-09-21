'use strict'

const Builder = require('../Builder')

class Capture extends Builder {
    constructor() {
        super()

        /** @var {string} _group Desired match group. */
        this._group = '(%s)'
    }
}

module.exports = Capture
