'use strict'

/**
 * Wrapper for literal strings that should not be split, tainted or interpreted in any way.
 */
class Literally {
    /**
     * @constructor
     * @param  {string} string
     */
    constructor(string) {
        // Just like stripslashes in PHP
        this._string = string.replace(/\\(.)/mg, '$1')
    }


    /**
     * @return  {string}
     */
    toString() {
        return this._string
    }
}

module.exports = Literally
