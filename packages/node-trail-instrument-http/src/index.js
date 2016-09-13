'use strict'

import shimmer from 'trail-shimmer'

module.exports = {
    target: 'http',
    wrap(agent, http) {
        agent.bindEmitter(http.Server.prototype)

        shimmer.wrap(
            http.Server.prototype,
            'http.Server.prototype',
            ['on', 'addListener'],
            function (addListener) {
                return function (type, listener) {
                    if (type === 'request' && typeof listener === 'function') {
                        return addListener.call(
                            this, type, require('./server')(listener, agent))
                    }
                    return addListener.apply(this, arguments)
                }
            })

        shimmer.wrap(http, 'http', 'request', function (original) {
            return require('./request')(original, agent)
        })

        return http
    },
    unwrap() {
        shimmer.unwrapAll()
    },
}
