# basictracer-javascript [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] [![Test coverage][coveralls-image]][coveralls-url]

> The Javascript implementation of the BasicTracer referrence implementation

## Installation

    npm install --save basictracer

## Usage

```js
var tracer = require('basictracer')
tracer.setRecorder(function record(span) {
    log(span)
})

var span = tracer.startSpan('operationName')
span.tag('key', 'value')
span.log('read', {duration: 1000})
span.finish()
```

See [tests](src/__tests__/tracer-test.js) for more example.

## Data Model

    type Span {
        operationName: String
        startTime: Number
        duration: Number
        tags: [Object]
        logs: [Array]

        traceId: Long
        spanId: Long
        parentId: String
        sampled: Boolean
        baggage: Object
    }

`Long` type represent by [long.js](https://github.com/dcodeIO/long.js)

## License

MIT

[npm-image]: https://img.shields.io/npm/v/basictracer.svg?style=flat
[npm-url]: https://npmjs.org/package/basictracer
[travis-image]: https://img.shields.io/travis/open-trail/basictracer-javascript.svg?style=flat
[travis-url]: https://travis-ci.org/open-trail/basictracer-javascript
[coveralls-image]: https://img.shields.io/coveralls/open-trail/basictracer-javascript.svg?style=flat
[coveralls-url]: https://coveralls.io/r/open-trail/basictracer-javascript?branch=master
