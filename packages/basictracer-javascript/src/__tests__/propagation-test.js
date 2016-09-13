'use strict'

import Tracer from '../tracer'
import {TextMapPropagator, BinaryPropagator} from '../propagation'

let tracer = new Tracer()
let textMapPropagator = new TextMapPropagator(tracer)
let binaryPropagator = new BinaryPropagator(tracer)

const OPERATION_NAME = 'basictracer-test'

describe('BinaryPropagator', () => {
    it('should inject into buffer field', () => {
        let span = tracer.startSpan(OPERATION_NAME)
        let carrier = {}
        binaryPropagator.inject(span, carrier)
        // Buffer instance
        should(carrier.buffer).be.type('object')
    })

    it('should link span via carrier', () => {
        let span = tracer.startSpan(OPERATION_NAME)
        let carrier = {}
        binaryPropagator.inject(span, carrier)

        let childSpan = binaryPropagator.join(OPERATION_NAME, carrier)
        should(childSpan.traceId.equals(span.traceId)).be.ok()
        should(childSpan.spanId.equals(span.spanId)).be.not.ok()
        should(childSpan.parentId.equals(span.spanId)).be.ok()
        should(childSpan.sampled).eql(span.sampled)
        should(childSpan.baggage).eql(span.baggage)
    })
})

describe('TextMapPropagator', () => {
    it('should inject into buffer field', () => {
        let span = tracer.startSpan(OPERATION_NAME)
        span.setBaggageItem('key', 'value')
        let carrier = {}
        textMapPropagator.inject(span, carrier)
        should(Object.keys(carrier).length).eql(4)
    })

    it('should link span via carrier', () => {
        let span = tracer.startSpan(OPERATION_NAME)
        let carrier = {}
        textMapPropagator.inject(span, carrier)

        let childSpan = textMapPropagator.join(OPERATION_NAME, carrier)
        should(childSpan.traceId.equals(span.traceId)).be.ok()
        should(childSpan.spanId.equals(span.spanId)).be.not.ok()
        should(childSpan.parentId.equals(span.spanId)).be.ok()
        should(childSpan.sampled).eql(span.sampled)
        should(childSpan.baggage).eql(span.baggage)
    })

    it('should report corrupted trace with invalid carrier', () => {
        let carrierMissingRequired = {
            traceId: undefined,
            spanId: 'hello',
            sampled: true,
        }
        should(() => {
            textMapPropagator.join(OPERATION_NAME, carrierMissingRequired)
        }).throw()

        let carrierInvalidSample = {
            traceId: 'hello',
            spanId: 'world',
            sampled: 'notTrue',
        }
        should(() => {
            textMapPropagator.join(OPERATION_NAME, carrierInvalidSample)
        }).throw()
    })
})
