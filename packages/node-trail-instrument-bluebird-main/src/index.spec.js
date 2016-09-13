'use strict'

import {expect} from 'chai'
import sinon from 'sinon'
import shimmer from 'trail-shimmer'
import agent from 'trail-agent'

import wrapper from '.'

describe('bluebird main wrap', function () {
    agent.setRecorder(() => {})
    let sandbox

    beforeEach(() => {
        sandbox = sinon.sandbox.create()
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should wrap bluebird.prototype._addCallbacks', function () {
        let shimmerWrapStub = sandbox.stub(shimmer, 'wrap')

        function bluebird() {
            // return itself (constructor)
            return bluebird
        }
        bluebird.prototype._addCallbacks = function () {}

        wrapper.wrap(agent, bluebird)

        expect(shimmerWrapStub).to.have.been.calledWith(bluebird.prototype, 'Bluebird.prototype', '_addCallbacks')
    })
})
