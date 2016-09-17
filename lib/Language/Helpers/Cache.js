'use strict'

const Builder = require('../../Builder')
const _cache = {}

/**
 * Temporary cache for already built SRL queries to speed up loops.
 */
const Cache = {
    /**
     * Set Builder for SRL to cache.
     *
     * @param  {string} query
     * @param  {Builder} builder
     */
    set(query, builder) {
        _cache[query] = builder
    },

    /**
     * Get SRL from cache, or return new Builder.
     *
     * @param  {string} query
     * @return {Builder}
     */
    get(query) {
        return _cache[query] || new Builder()
    },

    /**
     * Validate if current SRL is a already in cache.
     *
     * @param  {string} query
     * @return {boolean}
     */
    has(query) {
        return !!_cache[query]
    }
}

module.exports = Cache
