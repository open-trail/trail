'use strict'

import url from 'url'

function wrapRequest(originalHttpRequest, agent) {
    return function wrappedRequest() {
        let requestParams = arguments[0]

        // parse request
        if (typeof requestParams === 'string') {
            requestParams = url.parse(requestParams)
            requestParams.method = 'GET'
            arguments[0] = requestParams
        }

        if (requestParams.hostname) {
            requestParams.host = requestParams.hostname
        }

        // decorate headers
        requestParams.headers = requestParams.headers || {}

        const span = agent.fork(requestParams.path, agent.FORMAT_TEXT_MAP,
                              requestParams.headers)
        span.setTag('host', requestParams.host || 'localhost')
        span.setTag('host', requestParams.port || '80')
        span.setTag('protocol', 'http')

        const returned = originalHttpRequest.apply(this, arguments)

        returned.on('error', function () {
            span.setTag('status', 1)
            span.finish()
        })

        // returns with response
        returned.on('response', function (incomingMessage) {
            let status = incomingMessage.statusCode > 399 ? 1 : 0
            span.setTag('status', status)
            span.finish()
        })

        return returned
    }
}

module.exports = wrapRequest
