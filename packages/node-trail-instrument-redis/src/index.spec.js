'use strict'

import {expect} from 'chai'
import sinon from 'sinon'
import shimmer from 'trail-shimmer'
import agent from 'trail-agent'

import wrapper from '.'

describe('redis wrap', function () {
    let sandbox

    beforeEach(() => {
        sandbox = sinon.sandbox.create()
        agent.setSampler(() => true)
        agent.setRecorder(() => {})
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should wrap redis.RedisClient.prototype.send_command', function () {
        let shimmerWrapStub = sandbox.stub(shimmer, 'wrap')

        let fakeRedis = {
            RedisClient() {},
        }

        // wrapped as a side effect
        wrapper.wrap(null, fakeRedis)

        expect(shimmerWrapStub).to.have.been.calledWith(
            fakeRedis.RedisClient.prototype,
            'redis.RedisClient.prototype',
            'send_command'
        )
    })

    it('should record span when command is sent', function () {
        let shimmerWrapStub = sandbox.stub(shimmer, 'wrap')

        let fakeRedis = {
            RedisClient: function () { // eslint-disable-line
                this.address = 'fakeRedisAddress'
            },
        }
        let span = agent.fork('temporary')
        sandbox.spy(span, 'setTag')
        sandbox.spy(span, 'finish')
        sandbox.stub(agent, 'fork').returns(span)

        wrapper.wrap(agent, fakeRedis)
        let wrapOp = shimmerWrapStub.args[0][3]

        let fakeRedisClientSend = sandbox.spy((command, args, callback) => {
            callback(new Error('Oops'))
        })
        let RedisClient = fakeRedis.RedisClient
        wrapOp(fakeRedisClientSend).apply(
            new RedisClient(), ['hset', ['abc', 'def']])

        expect(agent.fork).to.have.been.calledOnce
        expect(span.setTag).to.have.been.callCount(4)
        expect(span.finish).to.have.been.calledOnce
        expect(span.setTag).to.have.been.calledWith('status', 1)
    })
})
