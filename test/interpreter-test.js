'use strict'

const assert = require('assert')
const Interpreter = require('../lib/Language/Interpreter')

describe('Interpreter Test', () => {
    it('Parser', () => {
        let regex = new Interpreter('aNy Character ONCE or more literAlly "fO/o"').get()
        assert.deepEqual(regex, /\w+(?:fO\/o)/)

        regex = new Interpreter(`
            begin with literally "http", optional "s", literally "://", optional "www.",
            anything once or more, literally ".com", must end
        `).get()
        assert.deepEqual(regex, /^(?:http)(?:(?:s))?(?::\/\/)(?:(?:www\.))?.+(?:\.com)$/)
        assert.ok(regex.test('http://www.ebay.com'))
        assert.ok(regex.test('https://google.com'))
        assert.ok(!regex.test('htt://google.com'))
        assert.ok(!regex.test('http://.com'))

        regex = new Interpreter(
            'begin with capture (digit from 0 to 8 once or more) if followed by "foo"'
        ).get()
        assert.deepEqual(regex, /^([0-8]+)(?=(?:foo))/)
        assert.ok(regex.test('142foo'))
        assert.ok(!regex.test('149foo'))
        assert.ok(!regex.test('14bar'))
        assert.equal('142foo'.match(regex)[1], '142')

        regex = new Interpreter('literally "colo", optional "u", literally "r"').get()
        assert.ok(regex.test('color'))
        assert.ok(regex.test('colour'))

        regex = new Interpreter(
            'starts with number from 0 to 5 between 3 and 5 times, must end'
        ).get()
        assert.ok(regex.test('015'))
        assert.ok(regex.test('44444'))
        assert.ok(!regex.test('444444'))
        assert.ok(!regex.test('1'))
        assert.ok(!regex.test('563'))

        regex = new Interpreter(
            'starts with digit exactly 2 times, letter at least 3 time'
        ).get()
        assert.deepEqual(regex, /^[0-9]{2}[a-z]{3,}/)
        assert.ok(regex.test('12abc'))
        assert.ok(regex.test('12abcd'))
        assert.ok(!regex.test('123abc'))
        assert.ok(!regex.test('1a'))
        assert.ok(!regex.test(''))
    })

    it('Email', () => {
        const regex = new Interpreter(`
            begin with any of (digit, letter, one of "._%+-") once or more,
            literally "@", either of (digit, letter, one of ".-") once or more, literally ".",
            letter at least 2, must end, case insensitive
        `).get()

        assert.ok(regex.test('sample@example.com'))
        assert.ok(regex.test('super-He4vy.add+ress@top-Le.ve1.domains'))
        assert.ok(!regex.test('sample.example.com'))
        assert.ok(!regex.test('missing@tld'))
        assert.ok(!regex.test('hav ing@spac.es'))
        assert.ok(!regex.test('no@pe.123'))
        assert.ok(!regex.test('invalid@email.com123'))
    })

    it('Capture Group', () => {
        const regex = new Interpreter(
            'literally "color:", whitespace, capture (letter once or more), literally ".", all'
        ).get()

        const target = 'Favorite color: green. Another color: yellow.'
        const matches = []
        let result = null
        while (result = regex.exec(target)) {
            matches.push(result[1])
        }

        assert.equal('green', matches[0])
        assert.equal('yellow', matches[1])
    })

    it('Parentheses', () => {
        let regex = new Interpreter(
            'begin with (literally "foo", literally "bar") twice must end'
        ).get()
        assert.deepEqual(regex, /^(?:(?:foo)(?:bar)){2}$/)
        assert.ok(regex.test('foobarfoobar'))
        assert.ok(!regex.test('foobar'))

        regex = new Interpreter(
            'begin with literally "bar", (literally "foo", literally "bar") twice must end'
        ).get()
        assert.deepEqual(regex, /^(?:bar)(?:(?:foo)(?:bar)){2}$/)
        assert.ok(regex.test('barfoobarfoobar'))

        regex = new Interpreter('(literally "foo") twice').get()
        assert.deepEqual(regex, /(?:(?:foo)){2}/)
        assert.ok(regex.test('foofoo'))
        assert.ok(!regex.test('foo'))
    })
})
