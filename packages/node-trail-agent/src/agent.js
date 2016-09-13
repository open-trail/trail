'use strict'

import Module from 'module'

import {Tracer} from 'basictracer'
import cls from 'continuation-local-storage'
import shimmer from 'trail-shimmer'

const CORE_INSTRUMENTS = ['trail-instrument-http']
const FIELD_SESSION_SPAN = 'session_span'
const MODULE_INSTRUMENTED = '__instrumentedByTrail'

export default class TrailAgent extends Tracer {

    constructor() {
        super()

        const NAMESPACE = 'trail'
        this.NAMESPACE = NAMESPACE
        this.ns = cls.createNamespace(NAMESPACE)
        this._instruments = {}

        this._hookModuleLoad()
        this.instrument(CORE_INSTRUMENTS)
    }

    /**
     * Install list of instrumenting modules.
     *
     *     var agent = require('trail-agent')
     *     agent.instrument['trail-instrument-http']
     *
     * @param  {Array.<string>} libs List of instrumenting modules.
     */
    instrument(libs) {
        libs.forEach((lib) => {
            let wrapper = require(lib)
            if (!wrapper.target) {
                throw new Error(`Expect module ${lib} have "target" field`)
            }
            this._instruments[wrapper.target] = wrapper
        })
    }
    /**
     * Instrument module.
     *
     * @param  {string} target Target module name.
     * @param  {*}      mod    Target module.
     */
    _instrument(target, mod) {
        let wrapper = this._instruments[target]
        wrapper.wrap(this, mod)
    }
    /**
     * Wrap Module._load to instrument target library.
     */
    _hookModuleLoad() {
        let self = this
        shimmer.wrap(Module, 'Module', '_load', function (load) {
            return function (file) {
                let mod = load.apply(this, arguments)

                // require instrument and not instrumented
                if (self._instruments[file] && !mod[MODULE_INSTRUMENTED]) {
                    mod[MODULE_INSTRUMENTED] = true
                    self._instrument(file, mod)
                }

                return mod
            }
        })
    }

    /**
     * Expose continuation-local-storage `namespace.bind` method.
     *
     * @return {Function} Wrapper function.
     */
    bind(fn) {
        return this.ns.bind(fn)
    }
    /**
     * Expose continuation-local-storage `namespace.bindEmitter` method.
     */
    bindEmitter(emitter) {
        this.ns.bindEmitter(emitter)
    }

    /**
     * Handle super.join exception.
     *
     * Corrupt carrier OR root span will raise exception. Root span will raise
     * exception because carrier don't have required fields: traceId, spanId,
     * sampled.
     *
     * @override
     */
    join(operationName, format, carrier) {
        let span
        try {
            span = super.join(operationName, format, carrier)
        } catch (err) {
            span = this.startSpan(operationName)
        }
        return span
    }

    /**
     * Start new session. One session have one session span, and multiple child
     * spans. Session span has tag `ServerReceive`.
     *
     * @param  {string} operationName
     * @param  {string} format
     * @param  {any} carrier
     * @return {Span} Session span.
     */
    start(operationName, format, carrier) {
        let sessionSpan = this.join(operationName, format, carrier)
        this.ns.set(FIELD_SESSION_SPAN, sessionSpan)
        sessionSpan.setTag('type', 'ServerReceive')
        return sessionSpan
    }

    /**
     * Create new child span via session span. The child span has tag
     * `ClientSend`.
     *
     * @param  {string} operationName
     * @param  {string=} format The format of carrier if present.
     * @param  {Object=} carrier Carrier to carry formated span.
     * @return {Span} Child span.
     */
    fork(operationName, format, carrier) {
        let sessionSpan = this.getSessionSpan()
        let span = this.startSpan(operationName, {
            parent: sessionSpan,
        })
        span.setTag('type', 'ClientSend')
        if (format && carrier) {
            this.inject(span, format, carrier)
        }
        return span
    }

    /**
     * Get current session span.
     * @return {Span}
     */
    getSessionSpan() {
        let span = this.ns.get(FIELD_SESSION_SPAN)
        if (!span) {
            span = this.startSpan('MissingContextSpan')
        }
        return span
    }
}
