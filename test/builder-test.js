'use strict'

const assert = require('assert')
const SRL = require('../')

describe('Builder isMatching', () => {
    it('Simple Phone Number Format', () => {
        const regex = new SRL()
            .startsWith()
            .literally('+')
            .digit().between(1, 3)
            .literally(' ')
            .digit().between(3, 4)
            .literally('-')
            .digit().onceOrMore()
            .mustEnd()

        assert.ok(regex.isMatching('+49 123-45'))
        assert.ok(regex.isMatching('+492 1235-4'))
        assert.ok(!regex.isMatching('+49 123 45'))
        assert.ok(!regex.isMatching('49 123-45'))
        assert.ok(!regex.isMatching('a+49 123-45'))
        assert.ok(!regex.isMatching('+49 123-45b'))
    })

    it('Simple Email Format', () => {
        const regex = new SRL()
            .startsWith()
            .anyOf((query) => {
                query.digit().letter().oneOf('._%+-')
            })
            .onceOrMore()
            .literally('@')
            .anyOf((query) => {
                query.digit().letter().oneOf('.-')
            })
            .onceOrMore()
            .literally('.')
            .letter().atLeast(2)
            .mustEnd()
            .caseInsensitive()

        assert.equal(regex.getMatch('sample@example.com')[0], 'sample@example.com')
        assert.equal(regex.getMatch('super-He4vy.add+ress@top-Le.ve1.domains')[0], 'super-He4vy.add+ress@top-Le.ve1.domains')
        assert.ok(!regex.isMatching('sample.example.com'))
        assert.ok(!regex.isMatching('missing@tld'))
        assert.ok(!regex.isMatching('hav ing@spac.es'))
        assert.ok(!regex.isMatching('no@pe.123'))
        assert.ok(!regex.isMatching('invalid@email.com123'))
    })

    it('Capture Group', () => {
        const regex = new SRL()
            .literally('colo')
            .optional('u')
            .literally('r')
            .anyOf((query) => {
                query.literally(':').and((query) => {
                    query.literally(' is')
                })
            })
            .whitespace()
            .capture((query) => {
                query.letter().onceOrMore()
            })
            .literally('.')

        assert.ok(regex.isMatching('my favorite color: blue.'))
        assert.ok(regex.isMatching('my favorite colour is green.'))
        assert.ok(!regex.isMatching('my favorite colour is green!'))

        const testcase = 'my favorite colour is green. And my favorite color: yellow.'
        const matches = regex.getMatch(testcase)
        assert.equal(matches[1], 'green')
    })

    it('More Methods', () => {
        const regex = new SRL()
            .noWhitespace()
            .literally('a')
            .ifFollowedBy((builder) => {
                return builder.noCharacter()
            })
            .tab()
            .mustEnd()
            .multiLine()

        const target = `
        ba\t
        aaabbb
        `
        assert.ok(regex.isMatching(target))

        const regex2 = new SRL()
            .startsWith()
            .literally('a')
            .newLine()
            .whitespace()
            .onceOrMore()
            .literally('b')
            .mustEnd()

        const target2 = `a
        b`
        assert.ok(regex2.isMatching(target2))
    })

    it('Replace', () => {
        const regex = new SRL()
            .capture((query) => {
                query.anyCharacter().onceOrMore()
            })
            .whitespace()
            .capture((query) => {
                query.digit().onceOrMore()
            })
            .literally(', ')
            .capture((query) => {
                query.digit().onceOrMore()
            })
            .caseInsensitive()
            .get()

        assert.equal('April 15, 2003'.replace(regex, '$1 1, $3'), 'April 1, 2003')
    })

    it('Lazyness', () => {
        const regex = new SRL()
            .capture((query) => {
                query.literally(',').twice()
                    .whitespace().optional()
                    .lazy()
            })

        const matches = regex.getMatch(',, ')
        assert.equal(matches[1], ',,')
        assert.notEqual(matches[1], ',, ')

        const regex2 = new SRL()
            .literally(',')
            .atLeast(1)
            .lazy()

        const matches2 = regex2.getMatch(',,,,,')
        assert.equal(matches2[0], ',')
        assert.notEqual(matches2[0], ',,,,,')

    })

    it('Global as Default', () => {
        const regex = new SRL()
            .literally('a')
            .get()

        let count = 0
        'aaa'.replace(regex, () => count++)

        assert.equal(count, 3)
    })

    it('Raw', () => {
        const regex = new SRL()
            .literally('foo')
            .raw('b[a-z]r')
            .raw(/\d+/)

        assert.ok(regex.isMatching('foobzr123'))
        assert.ok(regex.isMatching('foobar1'))
        assert.ok(!regex.isMatching('fooa'))
        assert.ok(!regex.isMatching('foobar'))
    })

    it('Remove modifier', () => {
        const regex = new SRL()
            .literally('foo')
            .removeModifier('g')
            .get()

        assert.deepEqual(regex, /(?:foo)/)
    })
})
