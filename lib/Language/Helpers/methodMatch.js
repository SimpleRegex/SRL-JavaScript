'use strict'

const buildQuery = require('./buildQuery')
const DefaultMethod = require('../Methods/Method')
const SimpleMethod = require('../Methods/SimpleMethod')
const ToMethod = require('../Methods/ToMethod')
const TimesMethod = require('../Methods/TimesMethod')
const AndMethod = require('../Methods/AndMethod')
const AsMethod = require('../Methods/AsMethod')

const SyntaxException = require('../../Exceptions/Syntax')

// Unimplemented: all lazy, single line, unicode, first match
const mapper = {
    'any character': { 'class': SimpleMethod, 'method': 'anyCharacter' },
    'backslash': { 'class': SimpleMethod, 'method': 'backslash' },
    'no character': { 'class': SimpleMethod, 'method': 'noCharacter' },
    'multi line': { 'class': SimpleMethod, 'method': 'multiLine' },
    'case insensitive': { 'class': SimpleMethod, 'method': 'caseInsensitive' },
    'starts with': { 'class': SimpleMethod, 'method': 'startsWith' },
    'start with': { 'class': SimpleMethod, 'method': 'startsWith' },
    'begin with': { 'class': SimpleMethod, 'method': 'startsWith' },
    'begins with': { 'class': SimpleMethod, 'method': 'startsWith' },
    'must end': { 'class': SimpleMethod, 'method': 'mustEnd' },
    'once or more': { 'class': SimpleMethod, 'method': 'onceOrMore' },
    'never or more': { 'class': SimpleMethod, 'method': 'neverOrMore' },
    'new line': { 'class': SimpleMethod, 'method': 'newLine' },
    'whitespace': { 'class': SimpleMethod, 'method': 'whitespace' },
    'no whitespace': { 'class': SimpleMethod, 'method': 'noWhitespace' },
    'anything': { 'class': SimpleMethod, 'method': 'any' },
    'tab': { 'class': SimpleMethod, 'method': 'tab' },
    'vertical tab': { 'class': SimpleMethod, 'method': 'verticalTab' },
    'digit': { 'class': SimpleMethod, 'method': 'digit' },
    'no digit': { 'class': SimpleMethod, 'method': 'noDigit' },
    'nondigit': { 'class': SimpleMethod, 'method': 'noDigit' },
    'number': { 'class': SimpleMethod, 'method': 'digit' },
    'letter': { 'class': SimpleMethod, 'method': 'letter' },
    'uppercase': { 'class': SimpleMethod, 'method': 'uppercaseLetter' },
    'once': { 'class': SimpleMethod, 'method': 'once' },
    'twice': { 'class': SimpleMethod, 'method': 'twice' },
    'word': { 'class': SimpleMethod, 'method': 'word' },
    'no word': { 'class': SimpleMethod, 'method': 'nonWord' },
    'nonword': { 'class': SimpleMethod, 'method': 'nonWord' },
    'carriage return': { 'class': SimpleMethod, 'method': 'carriageReturn' },
    'carriagereturn': { 'class': SimpleMethod, 'method': 'carriageReturn' },

    'literally': { 'class': DefaultMethod, 'method': 'literally' },
    'either of': { 'class': DefaultMethod, 'method': 'anyOf' },
    'any of': { 'class': DefaultMethod, 'method': 'anyOf' },
    'none of': { 'class': DefaultMethod, 'method': 'noneOf' },
    'if followed by': { 'class': DefaultMethod, 'method': 'ifFollowedBy' },
    'if not followed by': { 'class': DefaultMethod, 'method': 'ifNotFollowedBy' },
    'optional': { 'class': DefaultMethod, 'method': 'optional' },
    'until': { 'class': DefaultMethod, 'method': 'until' },
    'raw': { 'class': DefaultMethod, 'method': 'raw' },
    'one of': { 'class': DefaultMethod, 'method': 'oneOf' },

    'digit from': { 'class': ToMethod, 'method': 'digit' },
    'number from': { 'class': ToMethod, 'method': 'digit' },
    'letter from': { 'class': ToMethod, 'method': 'letter' },
    'uppercase letter from': { 'class': ToMethod, 'method': 'uppercaseLetter' },
    'exactly': { 'class': TimesMethod, 'method': 'exactly' },
    'at least': { 'class': TimesMethod, 'method': 'atLeast' },
    'between': { 'class': AndMethod, 'method': 'between' },
    'capture': { 'class': AsMethod, 'method': 'capture' }
}

/**
 * Match a string part to a method. Please note that the string must start with a method.
 *
 * @param {string} part
 * @throws {SyntaxException} If no method was found, a SyntaxException will be thrown.
 * @return {method}
 */
function methodMatch(part) {
    let maxMatch = null
    let maxMatchCount = 0

    // Go through each mapper and check if the name matches. Then, take the highest match to avoid matching
    // 'any', if 'any character' was given, and so on.
    Object.keys(mapper).forEach((key) => {
        const regex = new RegExp(`^(${key.replace(' ', ') (')})`, 'i')
        const matches = part.match(regex)

        const count = matches ? matches.length : 0

        if (count > maxMatchCount) {
            maxMatchCount = count
            maxMatch = key
        }
    })

    if (maxMatch) {
        // We've got a match. Create the desired object and populate it.
        const item = mapper[maxMatch]
        return new item['class'](maxMatch, item.method, buildQuery)
    }

    throw new SyntaxException(`Invalid method: ${part}`)
}

module.exports = methodMatch
