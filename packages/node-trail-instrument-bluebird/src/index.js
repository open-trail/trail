'use strict'

import shimmer from 'trail-shimmer'

module.exports = {
    target: 'bluebird',
    wrap(agent, bluebird) {
        shimmer.wrap(bluebird.prototype, 'bluebird.prototype', '_addCallbacks', function (original) {
            return function (fulfill, reject, progress, promise, receiver, domain) {
                if (typeof fulfill === 'function') {
                    fulfill = agent.bind(fulfill)
                }
                if (typeof reject === 'function') {
                    reject = agent.bind(reject)
                }
                if (typeof progress === 'function') {
                    progress = agent.bind(progress)
                }

                return original.call(
                    this,
                    fulfill,
                    reject,
                    progress,
                    promise,
                    receiver,
                    domain
                )
            }
        })

        return bluebird
    },
    unwrap() {
        shimmer.unwrapAll()
    },
}
