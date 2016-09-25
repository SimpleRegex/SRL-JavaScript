'use strict'

const assert = require('assert')
const Cache = require('../lib/Language/Helpers/Cache')
const Interpreter = require('../lib/Language/Interpreter')

describe('Cache', () => {
    it('Basic', () => {
        const re = {}
        Cache.set('test', re)
        assert.deepEqual(Cache.get('test'), re)
    })

    it('In interpreter', () => {
        const RE = /(?:a)/g
        const query = new Interpreter('Literally "a"')
        assert.deepEqual(query.get(), RE)

        const query2 = new Interpreter('Literally "a"')
        assert.notEqual(query2, RE)

        assert(query !== query2)
    })
})
