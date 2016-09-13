'use strict'

process.on('unhandledRejection', function (error) {
    console.error('Unhandled Promise Rejection:') // eslint-disable-line
    console.error(error && error.stack || error) // eslint-disable-line
})
