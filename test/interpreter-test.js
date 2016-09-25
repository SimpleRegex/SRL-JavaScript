'use strict'

const assert = require('assert')
const Interpreter = require('../lib/Language/Interpreter')

describe('Interpreter isMatching', () => {
    it('Parser', () => {
        let query = new Interpreter('aNy Character ONCE or more literAlly "fO/o"')
        assert.deepEqual(query.get(), /\w+(?:fO\/o)/g)

        query = new Interpreter(`
            begin with literally "http", optional "s", literally "://", optional "www.",
            anything once or more, literally ".com", must end
        `)
        assert.deepEqual(query.get(), /^(?:http)(?:(?:s))?(?::\/\/)(?:(?:www\.))?.+(?:\.com)$/g)
        assert.ok(query.builder.isMatching('http://www.ebay.com'))
        assert.ok(query.builder.isMatching('https://google.com'))
        assert.ok(!query.builder.isMatching('htt://google.com'))
        assert.ok(!query.builder.isMatching('http://.com'))

        query = new Interpreter(
            'begin with capture (digit from 0 to 8 once or more) if followed by "foo"'
        )
        assert.deepEqual(query.get(), /^([0-8]+)(?=(?:foo))/g)
        assert.ok(query.builder.isMatching('142foo'))
        assert.ok(!query.builder.isMatching('149foo'))
        assert.ok(!query.builder.isMatching('14bar'))
        assert.equal(query.builder.getMatch('142foo')[1], '142')

        query = new Interpreter('literally "colo", optional "u", literally "r"')
        assert.ok(query.builder.isMatching('color'))
        assert.ok(query.builder.isMatching('colour'))

        query = new Interpreter(
            'starts with number from 0 to 5 between 3 and 5 times, must end'
        )
        assert.ok(query.builder.isMatching('015'))
        assert.ok(query.builder.isMatching('44444'))
        assert.ok(!query.builder.isMatching('444444'))
        assert.ok(!query.builder.isMatching('1'))
        assert.ok(!query.builder.isMatching('563'))

        query = new Interpreter(
            'starts with digit exactly 2 times, letter at least 3 time'
        )
        assert.deepEqual(query.get(), /^[0-9]{2}[a-z]{3,}/g)
        assert.ok(query.builder.isMatching('12abc'))
        assert.ok(query.builder.isMatching('12abcd'))
        assert.ok(!query.builder.isMatching('123abc'))
        assert.ok(!query.builder.isMatching('1a'))
        assert.ok(!query.builder.isMatching(''))
    })

    it('Email', () => {
        const query = new Interpreter(`
            begin with any of (digit, letter, one of "._%+-") once or more,
            literally "@", either of (digit, letter, one of ".-") once or more, literally ".",
            letter at least 2, must end, case insensitive
        `)

        assert.ok(query.builder.isMatching('sample@example.com'))
        assert.ok(query.builder.isMatching('super-He4vy.add+ress@top-Le.ve1.domains'))
        assert.ok(!query.builder.isMatching('sample.example.com'))
        assert.ok(!query.builder.isMatching('missing@tld'))
        assert.ok(!query.builder.isMatching('hav ing@spac.es'))
        assert.ok(!query.builder.isMatching('no@pe.123'))
        assert.ok(!query.builder.isMatching('invalid@email.com123'))
    })

    it('Capture Group', () => {
        const query = new Interpreter(
            'literally "color:", whitespace, capture (letter once or more), literally ".", all'
        )

        const target = 'Favorite color: green. Another color: yellow.'
        const matches = []
        let result = null
        while (result = query.builder.exec(target)) {
            matches.push(result[1])
        }

        assert.equal('green', matches[0])
        assert.equal('yellow', matches[1])
    })

    it('Parentheses', () => {
        let query = new Interpreter(
            'begin with (literally "foo", literally "bar") twice must end'
        )
        assert.deepEqual(query.get(), /^(?:(?:foo)(?:bar)){2}$/g)
        assert.ok(query.builder.isMatching('foobarfoobar'))
        assert.ok(!query.builder.isMatching('foobar'))

        query = new Interpreter(
            'begin with literally "bar", (literally "foo", literally "bar") twice must end'
        )
        assert.deepEqual(query.get(), /^(?:bar)(?:(?:foo)(?:bar)){2}$/g)
        assert.ok(query.builder.isMatching('barfoobarfoobar'))

        query = new Interpreter('(literally "foo") twice')
        assert.deepEqual(query.get(), /(?:(?:foo)){2}/g)
        assert.ok(query.builder.isMatching('foofoo'))
        assert.ok(!query.builder.isMatching('foo'))
    })
})
