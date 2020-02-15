'use strict'

const assert = require('assert')
const SRL = require('../')

describe('Fix issue 17', () => {
    it('Capture group name assignment fails', () => {
        assert.doesNotThrow(() => {
            const query = new SRL('capture (literally "TEST") as test')
            const match = query.getMatch('WORD NOT HERE')
            assert.equal(match, null)
        }, TypeError)
    })
})


