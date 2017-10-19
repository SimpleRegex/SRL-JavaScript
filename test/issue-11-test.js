'use strict'

const assert = require('assert')
const SRL = require('../')

describe('Fix issue 11', () => {
    it('Numerical quantifies & non-capturing group', () => {
        const query = new SRL('digit, exactly 5 times, (letter, twice) optional')
        assert.ok(query.isMatching('12345'))
        assert.ok(query.isMatching('12345aa'))
    })

    it('Complicated case', () => {
        const query = new SRL('begin with, digit, exactly 5 times, ( literally \'-\', digit, exactly 4 times ), optional, must end')
        assert.ok(query.isMatching('12345-1234'))
    })
})


