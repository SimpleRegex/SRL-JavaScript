'use strict'

const assert = require('assert')
const Literally = require('../lib/Language/Helpers/Literally')
const parseParentheses = require('../lib/Language/Helpers/parseParentheses')

describe('ParseParentheses Test', () => {

    it('Default', () => {
        assert.deepEqual(parseParentheses('foo (bar) baz'), [ 'foo', [ 'bar' ], 'baz' ])

        assert.deepEqual(parseParentheses('(foo (bar) baz)'), [ 'foo', [ 'bar' ], 'baz' ])

        assert.deepEqual(parseParentheses('foo (bar)'), [ 'foo', [ 'bar'] ])

        assert.deepEqual(parseParentheses('(foo)bar'), [ [ 'foo' ], 'bar' ])

        assert.deepEqual(parseParentheses('foo (0)'), [ 'foo', [ '0' ] ])

        assert.deepEqual(
            parseParentheses('foo (bar (nested)) baz'),
            [ 'foo', [ 'bar', [ 'nested' ] ], 'baz' ]
        )

        assert.deepEqual(
            parseParentheses('foo boo (bar (nested) something) baz (bar (foo foo))'),
            [ 'foo boo', [ 'bar', [ 'nested' ], 'something' ], 'baz', [ 'bar', [ 'foo foo' ] ] ]
        )
    })

    it('Escaping', () => {
        assert.deepEqual(
            parseParentheses('foo (bar "(bla)") baz'),
            [ 'foo', [ 'bar', new Literally('(bla)') ], 'baz' ]
        )

        assert.deepEqual(
            parseParentheses('sample "foo" bar'),
            [ 'sample', new Literally('foo'), 'bar' ]
        )

        assert.deepEqual(
            parseParentheses('sample "foo"'),
            [ 'sample', new Literally('foo') ]
        )

        assert.deepEqual(
            parseParentheses('bar "(b\\"la)" baz'),
            [ 'bar', new Literally('(b\\"la)'), 'baz' ]
        )

        assert.deepEqual(
            parseParentheses('foo "ba\'r" baz'),
            [ 'foo', new Literally('ba\'r'), 'baz' ]
        )

        assert.deepEqual(
            parseParentheses('foo (bar \'(b\\\'la)\') baz'),
            [ 'foo', [ 'bar', new Literally('(b\\\'la)') ], 'baz']
        )

        assert.deepEqual(
            parseParentheses('bar "b\\\\\" (la) baz'),
            [ 'bar', new Literally('b\\\\'), [ 'la' ], 'baz' ]
        )

        assert.deepEqual(
            parseParentheses('"fizz" and "buzz" (with) "bar"'),
            [ new Literally('fizz'), 'and', new Literally('buzz'), [ 'with' ], new Literally('bar') ]
        )

        assert.deepEqual(
            parseParentheses('foo \\"boo (bar (nes"ted) s\\"om\\"")ething) baz (bar (foo foo))'),
            [ 'foo \\"boo', [ 'bar', [ 'nes', new Literally('ted) s"om"') ], 'ething' ], 'baz', [ 'bar', [ 'foo foo' ] ] ]
        )
    })

    it('Empty', () => {
        assert.deepEqual(parseParentheses(''), [])
    })
})
