'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const SRL = require('../')

function testRules() {
    const rulesDir = path.resolve(__dirname, './rules')
    const files = fs.readdirSync(rulesDir)

    files.forEach((file) => {
        // Ignore
        if (path.extname(file) !== '.rule') {
            return
        }

        const lines = fs.readFileSync(path.join(rulesDir, file), { encoding: 'utf-8' }).split('\n')
        runAssertions(buildData(lines))
    })
}

function applySpecialChars(target) {
    return target.replace('\\n', '\n').replace('\\t', '\t')
}

function getExpression(srl, query) {
    return `\n\nSupplied SRL Query: ${srl}\nGenerated Expression: ${query.getRawRegex()}\n\n`
}

function buildData(lines) {
    const data = {
        srl: null,
        matches: [],
        no_matches: [],
        captures: {}
    }
    let inCapture = false
    let captures = null // Remember captures' name and index.

    lines.forEach((line) => {
        if (line === '' || line.startsWith('#')) {
            return
        }

        if (inCapture && !line.startsWith('-')) {
            inCapture = false
        }

        if (line.startsWith('srl: ')) {
            captures = []

            data.srl = line.substr(5).replace(/as\s+"([^"]+)"/g, (s, c) => {
                captures.push(c)
                return ''
            })
        } else if (line.startsWith('match: "')) {
            data.matches.push(applySpecialChars(line.slice(8, -1)))
        } else if (line.startsWith('no match: "')) {
            data.no_matches.push(applySpecialChars(line.slice(11, -1)))
        } else if (
            line.startsWith('capture for "') &&
            line.substr(-2, 2) === '":'
        ) {
            inCapture = line.slice(13, -2)
            data['captures'][inCapture] = []
        } else if (
            inCapture &&
            line.startsWith('-')
        ) {
            const split = line.substr(1).split(': ')
            const index = captures.indexOf(split[1].trim())
            let target = data['captures'][inCapture][Number(split[0])]

            if (!target) {
                target = data['captures'][inCapture][Number(split[0])] = []
            }

            if (index !== -1) {
                target[index] = applySpecialChars(split[2].slice(1, -1))
            } else {
                target.push(applySpecialChars(split[2].slice(1, -1)))
            }
        }
    })

    return data
}

function runAssertions(data) {
    assert(data.srl, 'SRL for rule is empty. Invalid rule.')

    let query, assertionMade = false

    try {
        query = new SRL(data.srl)
    } catch (e) {
        assert(false, `Parser error: ${e.message}\n\nSupplied SRL Query: ${data.srl}\n\n`)
    }

    data.matches.forEach((match) => {
        assert(
            query.test(match),
            `Failed asserting that this query matches '${match}'.${getExpression(data.srl, query)}`
        )
        assertionMade = true
    })

    data.no_matches.forEach((noMatch) => {
        assert(
            !query.test(noMatch),
            `Failed asserting that this query does not match '${noMatch}'.${getExpression(data.srl, query)}`
        )
        assertionMade = true
    })

    Object.keys(data.captures).forEach((test) => {
        const expected = data.captures[test]
        const matches = []
        const regex = query.all()

        try {
            let result = null
            while (result = regex.exec(test)) {
                matches.push(result.map((item) => item === undefined ? '' : item).slice(1))

                if (regex.lastIndex === test.length - 1) {
                    break
                }
            }
        } catch (e) {
            assert(false, `Parser error: ${e.message}${getExpression(data.srl, query)}`)
        }

        assert.equal(
            expected.length,
            matches.length,
            `Invalid match count for test ${test}.${getExpression(data.srl, query)}`
        )

        matches.forEach((capture, index) => {
            assert.deepEqual(
                expected[index],
                capture,
                `The capture group did not return the expected results for test ${test}.${getExpression(data.srl, query)}`
            )
        })

        assertionMade = true
    })

    assert(assertionMade, `No assertion. Invalid rule. ${getExpression(data.srl, query)}`)
}

describe('Rules', () => {
    testRules()
})
