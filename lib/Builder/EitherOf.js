'use strict'

const Builder = require('../Builder')

class EitherOf extends Builder {
    constructor() {
        super()

        /** @var {string} _group Desired match group. */
        this._group = '(?:%s)'

        /** @var {string} _implodeString String to join with. */
        this._implodeString = '|'
    }
}

module.exports = EitherOf
