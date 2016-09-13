'use strict'

import shimmer from 'trail-shimmer'

module.exports = {
    target: 'redis',
    wrap(agent, redis) {
        shimmer.wrap(
            redis.RedisClient.prototype,
            'redis.RedisClient.prototype',
            'send_command',
            function (original) {
                return function (...args) {
                    let command = args[0]
                    let last = args[args.length - 1]

                    let span = agent.fork(command)
                    span.setTag('host', this.address)
                    span.setTag('protocol', 'redis')

                    let wrappedCallback = function (originalCallback) {
                        return function (err) {
                            span.setTag('status', err ? 1 : 0)
                            span.finish()

                            return originalCallback.apply(this, arguments)
                        }
                    }

                    if (last && typeof last === 'function') {
                        args[args.length - 1] = wrappedCallback(last)
                    } else if (Array.isArray(last) &&
                               typeof last[last.length - 1] === 'function') {
                        last[last.length - 1] =
                            wrappedCallback(last[last.length - 1])
                    } else {
                        args.push(wrappedCallback(function () { }))
                    }

                    return original.apply(this, args)
                }
            })

        return redis
    },
    unwrap() {
        shimmer.unwrapAll()
    },
}
