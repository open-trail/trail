'use strict'

import shimmer from 'trail-shimmer'

const CONNECTION_OPERATIONS = [
    'connect',
    'query',
    'end',
]

const POOL_OPERATIONS = [
    'getConnection',
    'query',
    'destroy',
]

function decideWrap(original, args, agent, methodName) {
    if (methodName === 'query') {
        let span = agent.fork(args[0])
        span.setTag('protocol', 'mysql')
        let connectionConfig = this.config.connectionConfig ?
            this.config.connectionConfig : this.config
        if (connectionConfig.host) {
            span.setTag('host', connectionConfig.host)
        }
        if (connectionConfig.port) {
            span.setTag('port', connectionConfig.port)
        }
        if (connectionConfig.database) {
            span.setTag('database', connectionConfig.database)
        }

        let wrappedCallback = function (originalCallback) {
            return function (err) {
                span.setTag('status', err ? 1 : 0)
                span.finish()
                return originalCallback.apply(this, arguments)
            }
        }

        let last = args[args.length - 1]
        if (last && typeof last === 'function') {
            args[args.length - 1] = wrappedCallback(last)
        } else if (Array.isArray(last) &&
                   typeof last[last.length - 1] === 'function') {
            let lastOfLast = last.length - 1
            args[args.length - 1][lastOfLast] =
                wrappedCallback(last[lastOfLast])
        } else {
            args.push(wrappedCallback(function () { }))
        }
    }
    return original.apply(this, args)
}

function wrap(agent, mysql) {
    let _createConnection = mysql.createConnection
    let _createPool = mysql.createPool

    mysql.createConnection = function (config) {
        let Connection = _createConnection(config)

        shimmer.wrap(Connection, 'Connection', CONNECTION_OPERATIONS, wrapQuery)

        return Connection
    }

    mysql.createPool = function (config) {
        let Pool = _createPool(config)

        shimmer.wrap(Pool, 'Pool', POOL_OPERATIONS, wrapQuery)

        return Pool
    }

    function wrapQuery(original, name) {
        return function (...args) {
            let last = args.length - 1
            let callback = args[last]

            if (typeof callback === 'function') {
                args[last] = agent.bind(callback)
            }
            return decideWrap.call(this, original, args, agent, name)
        }
    }

    return mysql
}

function unwrap() {
    shimmer.unwrapAll()
}

module.exports = {
    target: 'mysql',
    wrap,
    unwrap,
}
