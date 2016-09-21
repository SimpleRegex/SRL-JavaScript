# SRL-JavaScript

JavaScript implementation of [Simple Regex](https://simple-regex.com/) :tada::tada::tada:

[![npm version](https://badge.fury.io/js/srl.svg)](https://badge.fury.io/js/srl)
[![Build Status](https://travis-ci.org/SimpleRegex/SRL-JavaScript.svg?branch=master)](https://travis-ci.org/SimpleRegex/SRL-JavaScript)
[![codecov](https://codecov.io/gh/SimpleRegex/SRL-JavaScript/branch/master/graph/badge.svg)](https://codecov.io/gh/SimpleRegex/SRL-JavaScript)

> Because of the JavaScript regex engine, there is something different from [Simple Regex](https://simple-regex.com/) 
- NOT support `as` to assign capture name. 
- NOT support `if already had/if not already had` 
- NO `firstMatch`, since in JavaScript `lazy` means non-greedy (matching the fewest possible characters).

## Installation

```sh
npm install srl
```

## Usage

Class SRL accepts a Simple Regex Language string as input, and return the builder for the query. 

The builder can agent `test/exec` method to the generated regex object. Or you can use `get()` to take the generated regex object.

```js
const SRL = require('srl')
const query = new SRL('letter exactly 3 times')
const regex = query.get() // /[a-z]{3}/

query.test('aaa') // true
query.exec('aaa') // [ 'aaa', index: 0, input: 'aaa' ]

query
    .digit()
    .neverOrMore()
    .mustEnd()
    .get() // /[a-z]{3}[0-9]*$/
```

Required Node 6.0+ for the ES6 support, Or you can use [Babel](http://babeljs.io/) to support Node below 6.0.

Using [Webpack](http://webpack.github.io) and [babel-loader](https://github.com/babel/babel-loader) to pack it if want to use in browsers. 

## Development

First, clone repo and init submodule for test.

SRL-JavaScript depends on [Mocha](http://mochajs.org) and [Istanbul](https://github.com/gotwarlost/istanbul) to test code. You can use them like this:

```sh
npm install

npm test # test 
npm run coverage # Get coverage locally 
```

How to write Rules, see: [Test-Rules](https://github.com/SimpleRegex/Test-Rules).

## License

SRL-JavaScript is published under the MIT license. See LICENSE for more information.
