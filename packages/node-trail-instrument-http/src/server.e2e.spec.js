'use strict'

import http from 'http'

import {expect} from 'chai'
import agent from 'trail-agent'

import wrapper from '.'

describe('http.Server e2e', () => {
    const OPERATION_NAME = 'http.Server e2e'
    const HTTP_PORT = 6471
    let server
    let records

    beforeEach(() => {
        records = []
        agent.setSampler(() => true)
        agent.setRecorder((span) => {
            records.push(span)
        })
        wrapper.wrap(agent, http)
        server = http.createServer((request, response) => {
            response.end('hello world')
        })
        server.listen(HTTP_PORT)
    })

    afterEach(() => {
        server.close()
        wrapper.unwrap()
    })

    it('should record session span', (done) => {
        let path = '/session-span'
        remote.request({port: HTTP_PORT, path}, () => {
            expect(records.length).to.eql(1)
            let [span] = records
            expect(span.operationName).to.eql(path)
            expect(span.tags.protocol).to.eql('http')
            done()
        })
    })

    it('should join carrier in new session', (done) => {
        let rootSpan = agent.startSpan(OPERATION_NAME)
        let headers = {}
        agent.inject(rootSpan, agent.FORMAT_TEXT_MAP, headers)

        let path = '/join-span'
        remote.request({port: HTTP_PORT, path, headers}, () => {
            let [span] = records
            expect(span.operationName).to.eql(path)
            expect(rootSpan.spanId.equals(span.parentId)).to.be.true
            done()
        })
    })
})
