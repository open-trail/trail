'use strict'

import Tracer from '../tracer'
import Span from '../span'

let tracer = new Tracer()

const OPERATION_NAME = 'basictracer-test'
const ANOTHER_OPERATION_NAME = 'another-basictracer-test'

describe('Span', () => {
    it('should construct a new span', () => {
        let parent = {
            traceId: Span.generateUUID(),
            spanId: Span.generateUUID(),
            sampled: true,
            baggage: {},
        }
        let tags = {key: 'value'}
        let span = new Span(tracer, {
            operationName: OPERATION_NAME,
            parent,
            tags,
        })
        should(span.operationName).eql(OPERATION_NAME)
        // should auto create timestamp
        should(span.startTime).be.type('number')
        should(span.duration).not.be.ok()
        should(span.tags).eql(tags)
        // not referrence copy
        should(span.tags).not.equal(tags)
        should(span.logs).not.be.ok()

        should(span.traceId.equals(parent.traceId)).be.ok()
        should(span.spanId).be.type('object')
        should(span.parentId.equals(parent.spanId)).be.ok()
        should(span.sampled).eql(parent.sampled)
        should(span.baggage).be.type('object')
    })

    it('should create root span', () => {
        let rootSpan = new Span(tracer, {operationName: OPERATION_NAME})
        should(rootSpan.operationName).eql(OPERATION_NAME)
        should(rootSpan.startTime).be.type('number')
        should(rootSpan.duration).not.be.ok()
        should(rootSpan.tags).not.be.ok()
        should(rootSpan.logs).not.be.ok()

        should(rootSpan.traceId).be.type('object')
        should(rootSpan.spanId).be.type('object')
        should(rootSpan.parentId.equals(rootSpan.spanId)).be.ok()
        should(rootSpan.sampled).eql(false)
        should(rootSpan.baggage).be.type('object')
    })

    it('should allow change operationName', () => {
        let span = new Span(tracer, {operationName: OPERATION_NAME})
        should(span.operationName).eql(OPERATION_NAME)
        span.setOperationName(ANOTHER_OPERATION_NAME)
        should(span.operationName).eql(ANOTHER_OPERATION_NAME)
    })

    it('should set and update span tag', () => {
        let span = new Span(tracer, {operationName: OPERATION_NAME})
        should(span.tags).not.be.ok()

        span.setTag('key', 'value')
        should(span.tags).be.type('object')
        should(span.tags.key).eql('value')

        span.setTag('key', 'anotherValue')
        should(span.tags.key).eql('anotherValue')

        span.addTags({anotherKey: 'ops'})
        should(span.tags).eql({
            key: 'anotherValue',
            anotherKey: 'ops',
        })
    })

    it('should set and get baggage', () => {
        let span = new Span(tracer, {operationName: OPERATION_NAME})
        should(span.baggage).be.type('object')

        span.setBaggageItem('key', 'value')
        should(span.baggage).be.type('object')
        should(span.baggage.key).eql('value')
        should(span.getBaggageItem('key')).eql('value')
    })

    it('should create timestamped log entry', () => {
        let span = new Span(tracer, {operationName: OPERATION_NAME})
        should(span.logs).not.be.ok()

        span.log('read', {duration: 1000})
        should(span.logs).be.type('object')
        should(span.logs[0].timestamp).be.type('number')
        should(span.logs[0].event).eql('read')
        should(span.logs[0].payload).eql({duration: 1000})
    })

    it('should end span', () => {
        let span = new Span(tracer, {operationName: OPERATION_NAME})
        should(span.startTime).be.type('number')
        should(span.duration).not.be.ok()
        span.finish()
        should(span.duration).be.type('number')
    })
})
