'use strict'

let should = require('should')

Object.defineProperty(global, 'should', {
    value: should,
})

process.on('unhandledRejection', function (error) {
    console.error('Unhandled Promise Rejection:') // eslint-disable-line
    console.error(error && error.stack || error) // eslint-disable-line
})
