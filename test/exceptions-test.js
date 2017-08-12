'use strict'

const assert = require('assert')
const SRL = require('../')

const BuilderException = require('../lib/Exceptions/Builder')
const ImplementationException = require('../lib/Exceptions/Implementation')

describe('Builder Exceptions', () => {
    it('Raw method', () => {
        const regex = new SRL('Literally "a"')

        assert['throws'](() => {
            regex.raw(')')
        }, (error) => {
            return error instanceof BuilderException &&
                error.message === 'Adding raw would invalidate this regular expression. Reverted.' &&
                regex.test('a')
        })
    })


})

describe('Implementation Exception', () => {
    it('Lazy Method', () => {
        const regex = new SRL('Literally "a"')

        assert['throws'](() => {
            regex.lazy()
        }, (error) => {
            return error instanceof ImplementationException &&
                error.message === 'Cannot apply laziness at this point. Only applicable after quantifier.'
        })
    })
})
