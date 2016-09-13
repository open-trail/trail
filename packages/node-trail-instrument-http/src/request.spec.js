'use strict'

import {expect} from 'chai'
import cls from 'continuation-local-storage'
import sinon from 'sinon'
import agent from 'trail-agent'

import wrapRequest from './request'

describe('http.request wrap', () => {
    let ns = cls.getNamespace(agent.NAMESPACE)
    let sandbox
    let records

    beforeEach((done) => {
        ns.run(() => {
            records = []
            agent.setSampler(() => true)
            agent.setRecorder((span) => {
                records.push(span)
            })
            sandbox = sinon.sandbox.create()
            done()
        })
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should invoke agent.fork', () => {
        sandbox.spy(agent, 'fork')
        let request = wrapRequest(() => {
            return {on() {}}
        }, agent)
        request('/')

        expect(agent.fork).to.be.calledOnce
    })

    it('should record client request and inject into carrier', (done) => {
        let onResponse
        let request = (options) => {
            expect(Object.keys(options.headers).length).to.eql(3)
            return {
                on(type, cb) {
                    if (type === 'response') {
                        onResponse = cb
                    }
                },
            }
        }
        request = wrapRequest(request, agent)

        let path = '/client-request'
        request({path})
        let delay = 10
        setTimeout(() => {
            onResponse({statusCode: 200})
            let [span] = records
            expect(span.operationName).to.eql(path)
            expect(span.tags.protocol).to.eql('http')
            expect(span.duration).to.not.below(delay)
            done()
        }, delay)

    })
})
