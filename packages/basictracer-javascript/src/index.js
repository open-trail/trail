'use strict'

import Tracer from './tracer'
import Span from './span'

let tracer = new Tracer()

tracer.Tracer = Tracer
tracer.Span = Span

module.exports = tracer
