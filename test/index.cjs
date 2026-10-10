'use strict'

const typeProvider = require('../dist/cjs/index.js')
const testTypeProvider = require('./suite.cjs')

testTypeProvider(typeProvider)
