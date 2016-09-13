'use strict'

import {expect} from 'chai'
import agent from 'trail-agent'
import bluebird from 'bluebird'

import wrapper from '.'

describe('bluebird e2e', () => {
    agent.setRecorder(() => {})
    beforeEach((done) => {
        agent.ns.run(() => {
            done()
        })
        wrapper.wrap(agent, bluebird)
    })

    afterEach(() => {
        wrapper.unwrap()
    })

    it('should bluebird promise dont losing context', async () => {
        const sessionSpan = agent.start()

        await new bluebird((resolve) => {
            setTimeout(() => {
                resolve()
            }, 10)
        })
        const span = agent.fork()
        expect(sessionSpan.traceId).to.eql(span.traceId)
    })

    it('should handle concurrent task', async () => {
        const sessionSpan = agent.start()

        function createTask() {
            return new bluebird((resolve) => {
                const span = agent.fork()
                expect(sessionSpan.traceId).to.eql(span.traceId)
                resolve()
            })
        }

        await bluebird.all([createTask(), createTask()])
        await createTask()
    })
})
