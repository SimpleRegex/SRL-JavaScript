'use strict'

const Builder = require('../Builder')

class NonCapture extends Builder {
    constructor() {
        super()

        /** @var {string} _group Desired non capture group. */
        this._group = '(?:%s)'
    }
}

module.exports = NonCapture
