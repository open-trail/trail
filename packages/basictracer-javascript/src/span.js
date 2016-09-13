'use strict'

import uuid from 'node-uuid'
import clone from 'lodash.clone'
import Long from 'long'

// Implement https://github.com/opentracing/opentracing-javascript/blob/master/src%2Fspan.js
export default class Span {
    constructor(tracer, {operationName, parent, tags, startTime = Date.now()}) {
        this._tracer = tracer

        this.operationName = operationName

        if (parent) {
            this.traceId = parent.traceId
            this.spanId = Span.generateUUID()
            this.parentId = parent.spanId
            this.sampled = parent.sampled
            this.baggage = clone(parent.baggage)
        } else {
            this.traceId = Span.generateUUID()
            this.spanId = Span.generateUUID()
            this.parentId = this.spanId
            this.sampled = this._tracer._isSampled(this)
            this.baggage = {}
        }

        this.tags = clone(tags)

        this.startTime = startTime
    }

    setOperationName(name) {
        this.operationName = name
    }

    setTag(key, value) {
        if (!this.tags) {
            this.tags = {}
        }
        this.tags[key] = value
    }

    addTags(keyValuePairs) {
        for (let key in keyValuePairs) {
            this.setTag(key, keyValuePairs[key])
        }
    }

    setBaggageItem(key, value) {
        this.baggage[key] = value
    }

    getBaggageItem(key) {
        return this.baggage[key]
    }

    log(event, payload, timestamp = Date.now()) {
        if (!this.logs) {
            this.logs = []
        }
        this.logs.push({
            event,
            payload,
            timestamp,
        })
    }

    finish(finishTime = Date.now()) {
        this.duration = finishTime - this.startTime
        if (this.sampled) {
            this._tracer._record(this)
        }
    }

    static generateUUID() {
        let buffer = uuid.v4(null, new Buffer(8))
        return new Long(buffer.readUInt32LE(), buffer.readUInt32LE(4), true)
    }
}
