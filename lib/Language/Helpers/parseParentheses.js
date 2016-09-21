'use strict'

const SyntaxException = require('../../Exceptions/Syntax')
const Literally = require('./Literally')

/**
 * Parse parentheses and return multidimensional array containing the structure of the input string.
 * It will parse ( and ) and supports nesting, escaping using backslash and strings using ' or ".
 *
 * @param  {string} query
 * @return {array}
 * @throws {SyntaxException}
 */
function parseParentheses(query) {
    let openCount = 0
    let openPos = false
    let closePos = false
    let inString = false
    let backslash = false
    const stringPositions = []
    const stringLength = query.length

    if (query[0] === '(' && query[stringLength - 1] === ')') {
        query = query.slice(1, -1)
    }

    loop:
    for (let i = 0; i < stringLength; i++) {
        const char = query[i]

        if (inString) {
            if (
                char === inString &&
                (query[i - 1] !== '\\' || (query[i - 1] === '\\' && query[i - 2] === '\\'))
            ) {
                // We're no more in the string. Either the ' or " was not escaped, or it was but the backslash
                // before was escaped as well.
                inString = false

                // Also, to create a "Literally" object later on, save the string end position.
                stringPositions[stringPositions.length - 1].end = i - 1
            }

            continue
        }

        if (backslash) {
            // Backslash was defined in the last char. Reset it and continue, since it only matches one character.
            backslash = false
            continue
        }

        switch (char) {
        case '\\':
            // Set the backslash flag. This will skip one character.
            backslash = true
            break
        case '"':
        case '\'':
            // Set the string flag. This will tell the parser to skip over this string.
            inString = char
            // Also, to create a "Literally" object later on, save the string start position.
            stringPositions.push({ start: i })
            break
        case '(':
            // Opening parenthesis, increase the count and set the pointer if it's the first one.
            openCount++
            if (openPos === false) {
                openPos = i
            }
            break
        case ')':
            // Closing parenthesis, remove count
            openCount--
            if (openCount === 0) {
                // If this is the matching one, set the closing pointer and break the loop, since we don't
                // want to match any following pairs. Those will be taken care of in a later recursion step.
                closePos = i
                break loop
            }
            break
        }
    }

    if (openCount !== 0) {
        throw new SyntaxException('Non-matching parenthesis found.')
    }

    if (closePos === false) {
        // No parentheses found. Use end of string.
        openPos = closePos = stringLength
    }

    let result = createLiterallyObjects(query, openPos, stringPositions)

    if (openPos !== closePos) {
        // Parentheses found.
        // First part is definitely without parentheses, since we'll match the first pair.
        result = result.concat([
            // This is the inner part of the parentheses pair. There may be some more nested pairs, so we'll check them.
            parseParentheses(query.substr(openPos + 1, closePos - openPos - 1))
            // Last part of the string wasn't checked at all, so we'll have to re-check it.
        ], parseParentheses(query.substr(closePos + 1)))
    }

    return result.filter((item) => typeof item !== 'string' || item.length)
}

/**
 * Replace all "literal strings" with a Literally object to simplify parsing later on.
 *
 * @param  {string} string
 * @param  {number} openPos
 * @param  {array} stringPositions
 * @return {array}
 * @throws {SyntaxException}
 */
function createLiterallyObjects(query, openPos, stringPositions) {
    const firstRaw = query.substr(0, openPos)
    const result = [firstRaw.trim()]
    let pointer = 0

    stringPositions.forEach((stringPosition) => {
        if (!stringPosition.end) {
            throw new SyntaxException('Invalid string ending found.')
        }

        if (stringPosition.end < firstRaw.length) {
            // At least one string exists in first part, create a new object.

            // Remove the last part, since this wasn't parsed.
            result.pop()

            // Add part between pointer and string occurrence.
            result.push(firstRaw.substr(pointer, stringPosition.start - pointer).trim())

            // Add the string as object.
            result.push(new Literally(firstRaw.substr(
                stringPosition.start + 1,
                stringPosition.end - stringPosition.start
            )))

            result.push(firstRaw.substr(stringPosition.end + 2).trim())

            pointer = stringPosition.end + 2
        }
    })

    return result
}

module.exports = parseParentheses
