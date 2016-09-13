'use strict'

import chai, {expect} from 'chai'
import cls from 'continuation-local-storage'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import shimmer from 'trail-shimmer'

import TrailAgent from './agent'

const OPERATION_NAME = 'trailagent-test'
const debug = require('debug')('trail:tests')
chai.use(sinonChai)

describe('agent', () => {
    let agent = new TrailAgent()
    agent.setRecorder(() => {})
    let ns = cls.getNamespace(agent.NAMESPACE)

    beforeEach((done) => {
        ns.run(() => done())
    })

    it('should start session with session span', (done) => {
        let sessionSpan = agent.start(OPERATION_NAME, agent.FORMAT_TEXT_MAP,
                                       {})
        expect(sessionSpan.spanId.equals(sessionSpan.parentId)).to.be.true
        setTimeout(() => {
            let span = agent.getSessionSpan()
            expect(span.spanId.equals(sessionSpan.spanId)).to.be.true
            expect(sessionSpan.tags.type).to.eql('ServerReceive')
            done()
        }, 10)
    })

    it('should fork a child span', () => {
        let sessionSpan = agent.start(OPERATION_NAME, agent.FORMAT_TEXT_MAP,
                                       {})
        let childSpan = agent.fork(OPERATION_NAME)
        expect(childSpan.parentId.equals(sessionSpan.spanId)).to.be.true
        expect(childSpan.tags.type).to.eql('ClientSend')
    })

    it('should fork a child span with carrier', () => {
        let sessionSpan = agent.start(OPERATION_NAME, agent.FORMAT_TEXT_MAP,
                                       {})
        let carrier = {}
        let childSpan = agent.fork(OPERATION_NAME, agent.FORMAT_TEXT_MAP,
                                    carrier)
        let spanInNewSession = agent.join(OPERATION_NAME,
                                           agent.FORMAT_TEXT_MAP, carrier)
        expect(childSpan.parentId.equals(sessionSpan.spanId)).to.be.true
        expect(spanInNewSession.parentId.equals(childSpan.spanId)).to.be.true
        expect(Object.keys(carrier).length).to.eql(3)
    })

    it('should return session span in concurrent request', () => {
        function request(param) {
            return new Promise((resolve) => {
                debug('request start', param, ns)
                resolve(param)
            })
        }
        function preHandler(param) {
            return new Promise((resolve) => {
                ns.run(() => {
                    debug('preHandler start', param, ns)
                    let sessionSpan = agent.start(OPERATION_NAME,
                                                   agent.FORMAT_TEXT_MAP, {})
                    sessionSpan.log('param', param)
                    resolve(param)
                })
            })
        }
        function postHandler(param) {
            return new Promise((resolve) => {
                debug('postHandler start', param, ns)
                let sessionSpan = agent.getSessionSpan()
                sessionSpan.finish()
                debug('postHandler end', param, ns)
                resolve([sessionSpan.logs[0].payload, param])
            })
        }
        function procedure(param, timeouts) {
            return request(param)
                .then(delay(timeouts[0]))
                .then(preHandler)
                .then(delay(timeouts[1]))
                .then(postHandler)
                .then(([actual, expected]) => {
                    debug('request end', expected, ns)
                    expect(actual).to.eql(expected)
                })
        }
        function delay(timeout) {
            return (param) => {
                return new Promise((resolve) => {
                    debug('delay start', param, ns)
                    setTimeout(() => {
                        debug('delay end', param, ns)
                        resolve(param)
                    }, timeout)
                })
            }
        }

        // 1. First request create span at 10ms
        // 2. Second request create span at 15ms
        // 3. First request get current span at 20ms
        // 4. Second request get current span at 25ms
        // If thread local storage doesn't works, step 3 will get another
        // request's span.
        return Promise.all([
            procedure('AAA', [10, 10]),
            procedure('BBB', [15, 10]),
        ])
    })

    it('should instrument core libraries automatically', () => {
        let http = require('http')
        expect(http.request.__TR_unwrap).to.not.be.undefined
    })

    it('should instrument other libraries', () => {
        let redis = require('redis')
        expect(redis.RedisClient.prototype.send_command.__TR_unwrap).to.be.undefined // eslint-disable-line
        agent.instrument(['trail-instrument-redis'])
        redis = require('redis')
        expect(redis.RedisClient.prototype.send_command.__TR_unwrap).to.not.be.undefined // eslint-disable-line
    })

    it('should instrument and only instrument library once', () => {
        let sandbox = sinon.sandbox.create()
        sandbox.stub(shimmer, 'wrap')
        agent.instrument(['trail-instrument-redis'])
        expect(shimmer.wrap).to.be.callCount(0)
        sandbox.restore()
    })
})
