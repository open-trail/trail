# node-trail-shimmer [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] [![Test coverage][coveralls-image]][coveralls-url]

## Installation

    npm install --save trail-shimmer

## Usage

    var http = require('http')
    var shimmer = require('trail-shimmer')
    // wrap http.request method
    shimmer.wrap(http, 'http', 'request', function (originalRequest) {
        return function () {
            console.log('track your http.request invoke')
            return originalRequest.apply(this, arguments)
        }
    })

## License

MIT

[npm-image]: https://img.shields.io/npm/v/trail-shimmer.svg?style=flat
[npm-url]: https://npmjs.org/package/trail-shimmer
[travis-image]: https://img.shields.io/travis/open-trail/node-trail-shimmer.svg?style=flat
[travis-url]: https://travis-ci.org/open-trail/node-trail-shimmer
[coveralls-image]: https://img.shields.io/coveralls/open-trail/node-trail-shimmer.svg?style=flat
[coveralls-url]: https://coveralls.io/r/open-trail/node-trail-shimmer?branch=master
