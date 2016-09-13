'use strict'

import http from 'http'

import {expect} from 'chai'
import cls from 'continuation-local-storage'
import agent from 'trail-agent'

import wrapper from '.'

describe('http.request e2e', () => {
    const OPERATION_NAME = 'http.request e2e'
    const HTTP_PORT = 6471
    let records

    beforeEach(() => {
        records = []
        agent.setSampler(() => true)
        agent.setRecorder((span) => {
            records.push(span)
        })
        remote.listen(HTTP_PORT)
        wrapper.wrap(agent, http)
    })

    afterEach(() => {
        remote.close()
        wrapper.unwrap()
    })

    it('should record client request as standlone utility', (done) => {
        let path = '/standalone-client-request'
        http.get({port: HTTP_PORT, path}, (res) => {
            res.on('data', () => {
                let [span] = records
                expect(span.operationName).to.eql(path)
                expect(span.tags.protocol).to.eql('http')
                done()
            })
        })
    })

    it('should record request as part of service call', (done) => {
        let ns = cls.getNamespace(agent.NAMESPACE)
        ns.run(() => {
            let path = '/session-client-request'
            let sessionSpan = agent.start(OPERATION_NAME)
            http.get({port: HTTP_PORT, path}, (res) => {
                res.on('data', () => {
                    let [span] = records
                    expect(span.parentId.equals(sessionSpan.spanId)).to.be.true
                    done()
                })
            })
        })
    })
})
