# node-trail-agent [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] [![Test coverage][coveralls-image]][coveralls-url]

> Distributed tracing agent for Node.js

## Installation

    npm install --save trail-agent

## Usage

Install other instrument libraries

    npm install --save trail-instrument-redis

Initialize agent

    var agent = require('trail-agent')
    agent.instrument(['trail-instrument-redis'])
    agent.setRecorder((span) => {
        console.log(span)
    })

Record in anywhere else

    var agent = require('trail-agent')
    let span = agent.start()
    setTimeout(() => {
        span.setTag('key', 'value')
        span.finish()
    })

## Instrument library

To instrument library, you should provide a module with

* `target`: indicate targeting module name.
* `wrap(agent, module)`: method with trail-agent instance and target module as
    arguments, return wrapped module.
* `unwrap()`: method to unwrap method wrapped by `wrap()`, intention of this
    method is unwrap method in tests.

Common tags

* protocol
* host
* status

## License

MIT

[npm-image]: https://img.shields.io/npm/v/trail-agent.svg?style=flat
[npm-url]: https://npmjs.org/package/trail-agent
[travis-image]: https://img.shields.io/travis/open-trail/node-trail-agent.svg?style=flat
[travis-url]: https://travis-ci.org/open-trail/node-trail-agent
[coveralls-image]: https://img.shields.io/coveralls/open-trail/node-trail-agent.svg?style=flat
[coveralls-url]: https://coveralls.io/r/open-trail/node-trail-agent?branch=master
