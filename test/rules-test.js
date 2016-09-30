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

        it(file.slice(0, -5).split('_').join(' '), () => {
            const lines = fs.readFileSync(path.join(rulesDir, file), { encoding: 'utf-8' }).split('\n')
            runAssertions(buildData(lines))
        })
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

    lines.forEach((line) => {
        if (line === '' || line.startsWith('#')) {
            return
        }

        if (inCapture && !line.startsWith('-')) {
            inCapture = false
        }

        if (line.startsWith('srl: ')) {
            data.srl = line.substr(5)
        } else if (line.startsWith('match: "')) {
            data.matches.push(applySpecialChars(line.slice(8, -1)))
        } else if (line.startsWith('no match: "')) {
            data.no_matches.push(applySpecialChars(line.slice(11, -1)))
        } else if (
            line.startsWith('capture for "') &&
            line.substr(-2, 2) === '":'
        ) {
            inCapture = line.slice(13, -2)
            data.captures[inCapture] = []
        } else if (inCapture && line.startsWith('-')) {
            const split = line.substr(1).split(': ')
            let target = data.captures[inCapture][Number(split[0])]

            if (!target) {
                target = data.captures[inCapture][Number(split[0])] = []
            }

            target[split[1]] = applySpecialChars(split[2].slice(1, -1))
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
            query.isMatching(match),
            `Failed asserting that this query matches '${match}'.${getExpression(data.srl, query)}`
        )
        assertionMade = true
    })

    data.no_matches.forEach((noMatch) => {
        assert(
            !query.isMatching(noMatch),
            `Failed asserting that this query does not match '${noMatch}'.${getExpression(data.srl, query)}`
        )
        assertionMade = true
    })

    Object.keys(data.captures).forEach((test) => {
        const expected = data.captures[test]
        let matches = null

        try {
            matches = query.getMatches(test)
        } catch (e) {
            assert(false, `Parser error: ${e.message}${getExpression(data.srl, query)}`)
        }

        assert.equal(
            matches.length,
            expected.length,
            `Invalid match count for test ${test}.${getExpression(data.srl, query)}`
        )

        matches.forEach((capture, index) => {
            // const result = Array.from(capture).slice(1).map((item) => {
            //     return item === undefined ? '' : item
            // })
            const item = expected[index]

            for (const key in item) {
                if (typeof key === 'number') {
                    assert.equal(
                        capture[key + 1],
                        item[key],
                        `The capture group did not return the expected results for test ${test}.${getExpression(data.srl, query)}`
                    )
                } else {
                    assert.equal(
                        capture[key],
                        item[key],
                        `The capture group did not return the expected results for test ${test}.${getExpression(data.srl, query)}`
                    )
                }
            }
        })

        assertionMade = true
    })

    assert(assertionMade, `No assertion. Invalid rule. ${getExpression(data.srl, query)}`)
}

describe('Rules', () => {
    testRules()
})
