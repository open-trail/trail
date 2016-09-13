#! /usr/bin/env node
'use strict'

if (!process.argv[2]) {
    console.error('Usage: ./reousrces/dnode.js <port>') // eslint-disable-line
    process.exit(1)
}
const DNODE_PORT = process.argv[2]

let http = require('http')
let dnode = require('dnode')
let server

let remote = dnode({
    request(options, callback) {
        http.get(options, callback)
    },
    listen(port) {
        server = http.createServer((request, response) => {
            response.end('hello world')
        }).listen(port)
    },
    close() {
        server.close()
    },
})
remote.listen(DNODE_PORT)
console.log(`dnode start on ${DNODE_PORT}`) // eslint-disable-line
