'use strict'

const assert = require('assert')
const SRL = require('../lib/Builder')

describe('Builder Test', () => {
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

        assert.ok(regex.test('+49 123-45'))
        assert.ok(regex.exec('+492 1235-4'))
        assert.ok(!regex.test('+49 123 45'))
        assert.ok(!regex.exec('49 123-45'))
        assert.ok(!regex.test('a+49 123-45'))
        assert.ok(!regex.test('+49 123-45b'))
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
            .get() // Use get() to test resulting RegExp object.

        assert.equal('sample@example.com'.match(regex)[0], 'sample@example.com')
        assert.equal(regex.exec('super-He4vy.add+ress@top-Le.ve1.domains'), 'super-He4vy.add+ress@top-Le.ve1.domains')
        assert.ok(!regex.test('sample.example.com'))
        assert.ok(!regex.test('missing@tld'))
        assert.ok(!regex.test('hav ing@spac.es'))
        assert.ok(!regex.test('no@pe.123'))
        assert.ok(!regex.test('invalid@email.com123'))
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
            .get()

        assert.ok(regex.test('my favorite color: blue.'))
        assert.ok(regex.test('my favorite colour is green.'))
        assert.ok(!regex.test('my favorite colour is green!'))

        const testcase = 'my favorite colour is green. And my favorite color: yellow.'
        const matches = testcase.match(regex)
        assert.equal(matches[1], 'green')
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
            .get()

        const matches = ',, '.match(regex)
        assert.equal(matches[1], ',,')
        assert.notEqual(matches[1], ',, ')
    })

    it('Global', () => {
        const regex = new SRL()
            .literally('a')
            .all()
            .get()

        let count = 0
        'aaa'.replace(regex, () => count++ )

        assert.equal(count, 3)
    })

    it('Raw', () => {
        //$this->assertTrue(SRL::literally('foo')->raw('b[a-z]r')->isValid());
        const regex = new SRL()
            .literally('foo')
            .raw('b[a-z]r')
            .raw(/\d+/)

        assert.ok(regex.test('foobzr123'))
        assert.ok(regex.test('foobar1'))
        assert.ok(!regex.test('fooa'))
        assert.ok(!regex.test('foobar'))
    })
})
