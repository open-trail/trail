'use strict'

function wrapListener(listener, agent) {
    return function (request, response) {
        const requestUrl = request.url.split('?')[0]
        const headers = request.headers

        const span = agent.start(requestUrl, agent.FORMAT_TEXT_MAP, headers)
        const address = headers.host.split(':')
        span.setTag('host', address[0])
        span.setTag('port', address[1] || '80')
        span.setTag('protocol', 'http')

        response.once('finish', function instrumentedFinish() {
            let status = response.statusCode > 399 ? 1 : 0
            span.setTag('status', status)
            span.finish()
        })

        return listener.apply(this, arguments)
    }
}

module.exports = wrapListener
