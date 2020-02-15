'use strict'

const SyntaxException = require('./Exceptions/Syntax')
const BuilderException = require('./Exceptions/Builder')
const ImplementationException = require('./Exceptions/Implementation')

const NON_LITERAL_CHARACTERS = '[\\^$.|?*+()/'
const METHOD_TYPE_BEGIN = 0b00001
const METHOD_TYPE_CHARACTER = 0b00010
const METHOD_TYPE_GROUP = 0b00100
const METHOD_TYPE_QUANTIFIER = 0b01000
const METHOD_TYPE_ANCHOR = 0b10000
const METHOD_TYPE_UNKNOWN = 0b11111
const METHOD_TYPES_ALLOWED_FOR_CHARACTERS = METHOD_TYPE_BEGIN | METHOD_TYPE_ANCHOR | METHOD_TYPE_GROUP | METHOD_TYPE_QUANTIFIER | METHOD_TYPE_CHARACTER

const simpleMapper = {
    'startsWith': {
        'add': '^',
        'type': METHOD_TYPE_ANCHOR,
        'allowed': METHOD_TYPE_BEGIN
    },
    'mustEnd': {
        'add': '$',
        'type': METHOD_TYPE_ANCHOR,
        'allowed': METHOD_TYPE_CHARACTER | METHOD_TYPE_QUANTIFIER | METHOD_TYPE_GROUP
    },
    'onceOrMore': {
        'add': '+',
        'type': METHOD_TYPE_QUANTIFIER,
        'allowed': METHOD_TYPE_CHARACTER | METHOD_TYPE_GROUP
    },
    'neverOrMore': {
        'add': '*',
        'type': METHOD_TYPE_QUANTIFIER,
        'allowed': METHOD_TYPE_CHARACTER | METHOD_TYPE_GROUP
    },
    'any': {
        'add': '.',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'backslash': {
        'add': '\\\\',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'tab': {
        'add': '\\t',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'verticalTab': {
        'add': '\\v',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'newLine': {
        'add': '\\n',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'carriageReturn': {
        'add': '\\r',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'whitespace': {
        'add': '\\s',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'noWhitespace': {
        'add': '\\S',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'anyCharacter': {
        'add': '\\w',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'noCharacter': {
        'add': '\\W',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPES_ALLOWED_FOR_CHARACTERS
    },
    'word': {
        'add': '\\b',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPE_BEGIN
    },
    'nonWord': {
        'add': '\\B',
        'type': METHOD_TYPE_CHARACTER,
        'allowed': METHOD_TYPE_BEGIN
    }

}

class Builder {
    /**
     * @constructor
     */
    constructor() {
        /** @var {array} _regEx Regular Expression being built. */
        this._regEx = []

        /** @var {string} _modifiers Raw modifier to apply on. */
        this._modifiers = 'g'

        /** @var {number} _lastMethodType Type of last method, to avoid invalid builds. */
        this._lastMethodType = METHOD_TYPE_BEGIN

        /** @var {RegExp|null} _result Regular Expression Object built. */
        this._result = null

        /** @var {string} _group Desired group, if any */
        this._group = '%s'

        /** @var {string} _implodeString String to join with. */
        this._implodeString = ''

        /** @var {array} _captureNames Save capture names to map */
        this._captureNames = []
    }

    /**********************************************************/
    /*                     CHARACTERS                         */
    /**********************************************************/

    /**
     * Add raw Regular Expression to current expression.
     *
     * @param  {string|RegExp} regularExpression
     * @throws {BuilderException}
     * @return {Builder}
     */
    raw(regularExpression) {
        regularExpression = regularExpression instanceof RegExp ?
            regularExpression.toString().slice(1, -1) :
            regularExpression

        this._lastMethodType = METHOD_TYPE_UNKNOWN
        this.add(regularExpression)

        if (!this._isValid()) {
            this._revertLast()
            throw new BuilderException('Adding raw would invalidate this regular expression. Reverted.')
        }

        return this
    }

    /**
     * Literally match one of these characters.
     *
     * @param  {string} chars
     * @return {Builder}
     */
    oneOf(chars) {
        this._validateAndAddMethodType(METHOD_TYPE_CHARACTER, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        let result = chars.split('').map((character) => this.escape(character)).join('')
        result = result.replace('-', '\\-').replace(']', '\\]')

        return this.add(`[${result}]`)
    }

    /**
     * Literally match a character that is not one of these characters.
     *
     * @param  {string} chars
     * @return {Builder}
     */
    noneOf(chars) {
        this._validateAndAddMethodType(METHOD_TYPE_CHARACTER, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        let result = chars.split('').map((character) => this.escape(character)).join('')
        result = result.replace('-', '\\-').replace(']', '\\]')

        return this.add(`[^${result}]`)
    }

    /**
     * Literally match all of these characters in that order.
     *
     * @param  {string} chars One or more characters
     * @return {Builder}
     */
    literally(chars) {
        this._validateAndAddMethodType(METHOD_TYPE_CHARACTER, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)
        const result = chars.split('').map((character) => this.escape(character)).join('')

        return this.add(`(?:${result})`)
    }

    /**
     * Match any digit (in given span). Default will be a digit between 0 and 9.
     *
     * @param  {number} min
     * @param  {number} max
     * @return {Builder}
     */
    digit(min = 0, max = 9) {
        this._validateAndAddMethodType(METHOD_TYPE_CHARACTER, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this.add(`[${min}-${max}]`)
    }

    /**
     * Match any non-digit character (in given span). Default will be any character not between 0 and 9.
     *
     * @return {Builder}
     */
    noDigit() {
        this._validateAndAddMethodType(METHOD_TYPE_CHARACTER, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this.add('[^0-9]')
    }

    /**
     * Match any uppercase letter (between A to Z).
     *
     * @param  {string} min
     * @param  {string} max
     * @return {Builder}
     */
    uppercaseLetter(min = 'A', max = 'Z') {
        return this.add(`[${min}-${max}]`)
    }

    /**
     * Match any lowercase letter (bwteen a to z).
     * @param  {string} min
     * @param  {string} max
     * @return {Builder}
     */
    letter(min = 'a', max = 'z') {
        this._validateAndAddMethodType(METHOD_TYPE_CHARACTER, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this.add(`[${min}-${max}]`)
    }

    /**********************************************************/
    /*                        GROUPS                          */
    /**********************************************************/

    /**
     * Match any of these conditions.
     *
     * @param  {Closure|Builder|string} conditions Anonymous function with its Builder as first parameter.
     * @return {Builder}
     */
    anyOf(conditions) {
        this._validateAndAddMethodType(METHOD_TYPE_GROUP, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this._addClosure(new Builder()._extends('(?:%s)', '|'), conditions)
    }

    /**
     * Match all of these conditions, but in a non capture group.
     *
     * @param  {Closure|Builder|string} conditions Anonymous function with its Builder as a first parameter.
     * @return {Builder}
     */
    group(conditions) {
        this._validateAndAddMethodType(METHOD_TYPE_GROUP, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this._addClosure(new Builder()._extends('(?:%s)'), conditions)
    }

    /**
     * Match all of these conditions, Basically reverts back to the default mode, if coming from anyOf, etc.
     *
     * @param  {Closure|Builder|string} conditions
     * @return {Builder}
     */
    and(conditions) {
        this._validateAndAddMethodType(METHOD_TYPE_GROUP, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this._addClosure(new Builder(), conditions)
    }

    /**
     * Positive lookahead. Match the previous condition only if followed by given conditions.
     *
     * @param  {Closure|Builder|string} condition Anonymous function with its Builder as a first parameter.
     * @return {Builder}
     */
    ifFollowedBy(conditions) {
        this._validateAndAddMethodType(METHOD_TYPE_GROUP, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this._addClosure(new Builder()._extends('(?=%s)'), conditions)
    }

    /**
     * Negative lookahead. Match the previous condition only if NOT followed by given conditions.
     *
     * @param  {Closure|Builder|string} condition Anonymous function with its Builder as a first parameter.
     * @return {Builder}
     */
    ifNotFollowedBy(conditions) {
        this._validateAndAddMethodType(METHOD_TYPE_GROUP, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this._addClosure(new Builder()._extends('(?!%s)'), conditions)
    }

    /**
     * Create capture group of given conditions.
     *
     * @param  {Closure|Builder|string} condition Anonymous function with its Builder as a first parameter.
     * @param  {String} name
     * @return {Builder}
     */
    capture(conditions, name) {
        if (name) {
            this._captureNames.push(name)
        }

        this._validateAndAddMethodType(METHOD_TYPE_GROUP, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this._addClosure(new Builder()._extends('(%s)'), conditions)
    }

    /**********************************************************/
    /*                      QUANTIFIERS                       */
    /**********************************************************/

    /**
     * Make the last or given condition optional.
     *
     * @param  {null|Closure|Builder|string} conditions Anonymous function with its Builder as a first parameter.
     * @return {Builder}
     */
    optional(conditions = null) {
        this._validateAndAddMethodType(METHOD_TYPE_QUANTIFIER, METHOD_TYPE_CHARACTER | METHOD_TYPE_GROUP)

        if (!conditions) {
            return this.add('?')
        }

        return this._addClosure(new Builder()._extends('(?:%s)?'), conditions)
    }

    /**
     * Previous match must occur so often.
     *
     * @param  {number} min
     * @param  {number} max
     * @return {Builder}
     */
    between(min, max) {
        this._validateAndAddMethodType(METHOD_TYPE_QUANTIFIER, METHOD_TYPE_CHARACTER | METHOD_TYPE_GROUP)

        return this.add(`{${min},${max}}`)
    }

    /**
     * Previous match must occur at least this often.
     *
     * @param  {number} min
     * @return {Builder}
     */
    atLeast(min) {
        this._validateAndAddMethodType(METHOD_TYPE_QUANTIFIER, METHOD_TYPE_CHARACTER | METHOD_TYPE_GROUP)

        return this.add(`{${min},}`)
    }

    /**
     * Previous match must occur exactly once.
     *
     * @return {Builder}
     */
    once() {
        return this.exactly(1)
    }

    /**
     * Previous match must occur exactly twice.
     *
     * @return {Builder}
     */
    twice() {
        return this.exactly(2)
    }

    /**
     * Previous match must occur exactly this often.
     *
     * @param  {number} count
     * @return {Builder}
     */
    exactly(count) {
        this._validateAndAddMethodType(METHOD_TYPE_QUANTIFIER, METHOD_TYPE_CHARACTER | METHOD_TYPE_GROUP)

        return this.add(`{${count}}`)
    }

    /**
     * Match less chars instead of more (lazy).
     *
     * @return {Builder}
     * @throws {ImplementationException}
     */
    lazy() {
        const chars = '+*}?'
        const raw = this.getRawRegex()
        const last = raw.substr(-1)
        const lastMethodType = this._lastMethodType
        this._lastMethodType = METHOD_TYPE_QUANTIFIER

        if (!chars.includes(last)) {
            if (last === ')' && chars.includes(raw.substr(-2, 1))) {
                const target = lastMethodType === METHOD_TYPE_GROUP ? this._revertLast().slice(0, -1) + '?)' : '?'
                return this.add(target)
            }

            throw new ImplementationException('Cannot apply laziness at this point. Only applicable after quantifier.')
        }

        return this.add('?')
    }

    /**
     * Match up to the given condition.
     *
     * @param  {Closure|Builder|string} toCondition
     * @return {Builder}
     */
    until(toCondition) {
        this.lazy()
        this._validateAndAddMethodType(METHOD_TYPE_GROUP, METHOD_TYPES_ALLOWED_FOR_CHARACTERS)

        return this._addClosure(new Builder(), toCondition)
    }

    /**********************************************************/
    /*                   MODIFIER MAPPER                      */
    /**********************************************************/

    multiLine() {
        return this._addUniqueModifier('m')
    }

    caseInsensitive() {
        return this._addUniqueModifier('i')
    }

    // Todo
    // unicode()
    // sticky()

    /**********************************************************/
    /*                   SIMPLE MAPPER                        */
    /**********************************************************/

    startsWith() {
        return this._addFromMapper('startsWith')
    }

    mustEnd() {
        return this._addFromMapper('mustEnd')
    }

    onceOrMore() {
        return this._addFromMapper('onceOrMore')
    }

    neverOrMore() {
        return this._addFromMapper('neverOrMore')
    }

    any() {
        return this._addFromMapper('any')
    }

    backslash() {
        return this._addFromMapper('backslash')
    }

    tab() {
        return this._addFromMapper('tab')
    }

    verticalTab() {
        return this._addFromMapper('verticalTab')
    }

    newLine() {
        return this._addFromMapper('newLine')
    }

    whitespace() {
        return this._addFromMapper('whitespace')
    }

    noWhitespace() {
        return this._addFromMapper('noWhitespace')
    }

    anyCharacter() {
        return this._addFromMapper('anyCharacter')
    }

    noCharacter() {
        return this._addFromMapper('noCharacter')
    }

    word() {
        return this._addFromMapper('word')
    }

    nonWord() {
        return this._addFromMapper('nonWord')
    }

    /**********************************************************/
    /*                   INTERNAL METHODS                     */
    /**********************************************************/

    /**
     * Escape specific character.
     *
     * @param  {string} character
     * @return {string}
     */
    escape(character) {
        return (NON_LITERAL_CHARACTERS.includes(character) ? '\\' : '') + character
    }

    /**
     * Get the raw regular expression string.
     *
     * @return string
     */
    getRawRegex() {
        return this._group.replace('%s', this._regEx.join(this._implodeString))
    }

    /**
     * Get all set modifiers.
     *
     * @return {string}
     */
    getModifiers() {
        return this._modifiers
    }

    /**
     * Add condition to the expression query.
     *
     * @param  {string} condition
     * @return {Builder}
     */
    add(condition) {
        this._result = null // Reset result to make up a new one.
        this._regEx.push(condition)
        return this
    }

    /**
     * Validate method call. This will throw an exception if the called method makes no sense at this point.
     * Will add the current type as the last method type.
     *
     * @param  {number} type
     * @param  {number} allowed
     * @param  {string} methodName
     */
    _validateAndAddMethodType(type, allowed, methodName) {
        if (allowed & this._lastMethodType) {
            this._lastMethodType = type
            return
        }

        const message = {
            [METHOD_TYPE_BEGIN]: 'at the beginning',
            [METHOD_TYPE_CHARACTER]: 'after a literal character',
            [METHOD_TYPE_GROUP]: 'after a group',
            [METHOD_TYPE_QUANTIFIER]: 'after a quantifier',
            [METHOD_TYPE_ANCHOR]: 'after an anchor'
        }[this._lastMethodType]

        throw new ImplementationException(
            `Method ${methodName} is not allowed ${message || 'here'}`
        )
    }

    /**
     * Add the value form simple mapper to the regular expression.
     *
     * @param  {string} name
     * @return {Builder}
     * @throws {BuilderException}
     */
    _addFromMapper(name) {
        const item = simpleMapper[name]
        if (!item) {
            throw new BuilderException('Unknown mapper.')
        }

        this._validateAndAddMethodType(item.type, item.allowed, name)
        return this.add(item.add)
    }

    /**
     * Add a specific unique modifier. This will ignore all modifiers already set.
     *
     * @param  {string} modifier
     * @return {Builder}
     */
    _addUniqueModifier(modifier) {
        this._result = null

        if (!this._modifiers.includes(modifier)) {
            this._modifiers += modifier
        }

        return this
    }

    /**
     * Build the given Closure or string and append it to the current expression.
     *
     * @param  {Builder} builder
     * @param  {Closure|Builder|string} conditions Either a closure, literal character string or another Builder instance.
     */
    _addClosure(builder, conditions) {
        if (typeof conditions === 'string') {
            builder.literally(conditions)
        } else if (conditions instanceof Builder) {
            builder.raw(conditions.getRawRegex())
        } else {
            conditions(builder)
        }

        return this.add(builder.getRawRegex())
    }

    /**
     * Get and remove last added element.
     *
     * @return  {string}
     */
    _revertLast() {
        return this._regEx.pop()
    }

    /**
     * Build and return the resulting RegExp object. This will apply all the modifiers.
     *
     * @return {RegExp}
     * @throws {SyntaxException}
     */
    get() {
        if (this._isValid()) {
            return this._result
        } else {
            throw new SyntaxException('Generated expression seems to be invalid.')
        }
    }

    /**
     * Validate regular expression.
     *
     * @return {boolean}
     */
    _isValid() {
        if (this._result) {
            return true
        } else {
            try {
                this._result = new RegExp(this.getRawRegex(), this.getModifiers())
                return true
            } catch (e) {
                return false
            }
        }
    }

    /**
     * Extends self to match more cases.
     *
     * @param  {string} group
     * @param  {string} implodeString
     * @return {Builder}
     */
    _extends(group, implodeString = '') {
        this._group = group
        this._implodeString = implodeString
        return this
    }

    /**
     * Clone a new builder object.
     *
     * @return {Builder}
     */
    clone() {
        const clone = new Builder()

        // Copy deeply
        clone._regEx = Array.from(this._regEx)
        clone._modifiers = this._modifiers
        clone._lastMethodType = this._lastMethodType
        clone._group = this._group

        return clone
    }

    /**
     * Remote specific flag.
     *
     * @param  {string} flag
     * @return {Builder}
     */
    removeModifier(flag) {
        this._modifiers = this._modifiers.replace(flag, '')
        this._result = null

        return this
    }

    /**********************************************************/
    /*                   REGEX METHODS                        */
    /**********************************************************/
    exec() {
        const regexp = this.get()
        return regexp.exec.apply(regexp, arguments)
    }

    test() {
        const regexp = this.get()
        return regexp.test.apply(regexp, arguments)
    }

    /**********************************************************/
    /*                 ADDITIONAL METHODS                     */
    /**********************************************************/

    /**
     * Just like test in RegExp, but reset lastIndex.
     *
     * @param  {string} target
     * @return {boolean}
     */
    isMatching(target) {
        const result = this.test(target)
        this.get().lastIndex = 0
        return result
    }

    /**
     * Map capture index to name.
     * When `exec` give the result like: [ 'aa ', 'aa', index: 0, input: 'aa bb cc dd' ]
     * Then help to resolve to return: [ 'aa ', 'aa', index: 0, input: 'aa bb cc dd', [captureName]: 'aa' ]
     *
     * @param {object} result
     * @return {object}
     */
    _mapCaptureIndexToName(result) {
        const names = this._captureNames

        // No match
        if (!result) {return null}

        return Array.prototype.reduce.call(result.slice(1), (result, current, index) => {
            if (names[index]) {
                result[names[index]] = current || ''
            }

            return result
        }, result)
    }

    /**
     * Just like match in String, but reset lastIndex.
     *
     * @param  {string} target
     * @return {array|null}
     */
    getMatch(target) {
        const regex = this.get()
        const result = regex.exec(target)
        regex.lastIndex = 0

        return this._mapCaptureIndexToName(result)
    }

    /**
     * Get all matches, just like loop for RegExp.exec.
     * @param  {string} target
     */
    getMatches(target) {
        const result = []
        const regex = this.get()
        let temp = null

        while (temp = regex.exec(target)) {
            temp = this._mapCaptureIndexToName(temp)
            result.push(temp)
        }
        regex.lastIndex = 0

        return result
    }
}

module.exports = Builder
