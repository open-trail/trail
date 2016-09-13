'use strict'

import {expect} from 'chai'
import sinon from 'sinon'
import shimmer from 'trail-shimmer'
import agent from 'trail-agent'

import wrapper from '.'

describe('mysql wrap', function () {
    agent.setRecorder(() => {})
    let sandbox

    beforeEach(() => {
        sandbox = sinon.sandbox.create()
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should wrap Connection and Pool', function () {
        let shimmerWrapStub = sandbox.stub(shimmer, 'wrap')

        let fakeQueryable = {
            query() {

            },
        }
        let fakeMysql = {
            createConnection() {
                return fakeQueryable
            },
            createPool() {
                return fakeQueryable
            },
        }

        wrapper.wrap(null, fakeMysql)
        expect(shimmerWrapStub).to.have.been.callCount(0)

        fakeMysql.createConnection()
        fakeMysql.createPool()
        expect(shimmerWrapStub).to.have.been.callCount(2)
    })
})
