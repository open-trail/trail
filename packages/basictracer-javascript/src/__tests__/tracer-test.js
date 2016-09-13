'use strict'

import constants from '../constants'
import Tracer from '../tracer'

let tracer = new Tracer()

const OPERATION_NAME = 'basictracer-test'
const ANOTHER_OPERATION_NAME = 'another-basictracer-test'

describe('Tracer', () => {
    it('should create root span', () => {
        let rootSpan = tracer.startSpan(OPERATION_NAME)
        should(rootSpan.traceId).be.ok()
        should(rootSpan.spanId).be.ok()
        should(rootSpan.parentId.equals(rootSpan.spanId)).be.ok()
        should(rootSpan.sampled).be.type('boolean')
        should(rootSpan.baggage).be.type('object')
    })

    it('should inject context into carrier', () => {
        let parentSpan = tracer.startSpan(OPERATION_NAME)
        let carrier = {}
        tracer.inject(parentSpan, constants.FORMAT_TEXT_MAP, carrier)
        should(Object.keys(carrier).length).eql(3)
    })

    it('should join receving span', () => {
        // inject
        let parentSpan = tracer.startSpan(OPERATION_NAME)
        let carrier = {}
        tracer.inject(parentSpan, constants.FORMAT_TEXT_MAP, carrier)

        // join
        let span = tracer.join(ANOTHER_OPERATION_NAME,
                               constants.FORMAT_TEXT_MAP, carrier)
        should(span.traceId.equals(parentSpan.traceId)).be.ok()
        should(span.spanId.equals(parentSpan.spanId)).be.not.ok()
        should(span.parentId.equals(parentSpan.spanId)).be.ok()
        should(span.sampled).eql(parentSpan.sampled)
        should(span.baggage).eql(parentSpan.baggage)
    })

    it('should join binary span', () => {
        // inject
        let parentSpan = tracer.startSpan(OPERATION_NAME)
        let carrier = {}
        tracer.inject(parentSpan, constants.FORMAT_BINARY, carrier)

        // join
        let span = tracer.join(ANOTHER_OPERATION_NAME, constants.FORMAT_BINARY,
                               carrier)
        should(span.traceId.equals(parentSpan.traceId)).be.ok()
        should(span.spanId.equals(parentSpan.spanId)).be.not.ok()
        should(span.parentId.equals(parentSpan.spanId)).be.ok()
        should(span.sampled).eql(parentSpan.sampled)
        should(span.baggage).eql(parentSpan.baggage)
    })

    it('should able to in process span creation', () => {
        let parentSpan = tracer.startSpan(OPERATION_NAME)
        let span = tracer.startSpan(ANOTHER_OPERATION_NAME, {
            parent: parentSpan,
        })
        should(span.traceId.equals(parentSpan.traceId)).be.ok()
        should(span.spanId.equals(parentSpan.spanId)).be.not.ok()
        should(span.parentId.equals(parentSpan.spanId)).be.ok()
        should(span.sampled).eql(parentSpan.sampled)
        should(span.baggage).be.type('object')
    })
})
