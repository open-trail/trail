'use strict'

// from: https://github.com/othiym23/shimmer
let debug = require('debug')('trail-shimmer')

// Keep initialization idempotent.
let shimmer = {}

let instrumented = []

let isTest = process.env.NODE_ENV === 'test'

function wrap(nodule, noduleName, methods, wrapper) {
    if (!methods) {
        return debug('Must include a method name to wrap')
    }

    if (!noduleName) {
        noduleName = '[unknown]'
    }
    if (!Array.isArray(methods)) {
        methods = [methods]
    }

    methods.forEach(function (method) {
        let fqmn = noduleName + '.' + method

        if (!nodule) {
            return
        }
        if (!wrapper) {
            return
        }

        let original = nodule[method]

        if (!original) {
            return debug('%s not defined, so not wrapping.', fqmn)
        }
        if (original.__TR_unwrap) {
            return debug('%s already wrapped by agent.', fqmn)
        }

        let wrapped = wrapper(original, method)
        wrapped.__TR_unwrap = function __TR_unwrap() { // eslint-disable-line
            nodule[method] = original
            debug('Removed instrumentation from %s.', fqmn)
        }

        if (isTest) {
            instrumented.push(wrapped)
        }

        debug('Instrumented %s.', fqmn)

        nodule[method] = wrapped
    })
}

function unwrap(nodule, noduleName, method) {
    if (!noduleName) {
        noduleName = '[unknown]'
    }
    if (!method) {
        return
    }

    if (!nodule) {
        return
    }
    let wrapped = nodule[method]

    if (!wrapped) {
        return
    }
    if (!wrapped.__TR_unwrap) {
        return
    }

    wrapped.__TR_unwrap()
}

function unwrapAll() {
    if (!isTest) {
        debug('WARNING: You called unwrapAll(), but you aren\'t in a testing ' +
              'environment. This operation will most likely be ineffective. ' +
              'Set NODE_ENV=test')
    }
    instrumented.forEach(function (wrapper) {
        wrapper.__TR_unwrap()
    })
    instrumented = []
}

shimmer.wrap = wrap
shimmer.unwrap = unwrap
shimmer.unwrapAll = unwrapAll

module.exports = shimmer
