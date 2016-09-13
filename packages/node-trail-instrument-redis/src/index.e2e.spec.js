'use strict'

import {expect} from 'chai'
import redis from 'redis'
import agent from 'trail-agent'

import wrapper from '.'

describe('redis e2e', () => {
    let records
    let redisClient

    beforeEach((done) => {
        records = []
        agent.setSampler(() => true)
        agent.setRecorder((span) => {
            records.push(span)
        })
        wrapper.wrap(agent, redis)
        redisClient = redis.createClient({no_ready_check: true}) // eslint-disable-line
        redisClient.on('ready', done)
    })

    afterEach(() => {
        wrapper.unwrap()
    })

    it('should instrument operation test #1', (done) => {
        redisClient.sadd('x', 6, () => {
            let [span] = records
            expect(span.operationName).to.eql('sadd')
            done()
        })
    })

    it('should instrument operation test #2', (done) => {
        let tasks = []
        let index
        for (index = 0; index < 3; index++) {
            tasks.push(sadd(index))
        }
        Promise.all(tasks)
            .then(() => {
                expect(records.length).to.eql(index)
                done()
            })
            .catch(done)

        function sadd(value) {
            return new Promise((resolve, reject) => {
                redisClient.sadd('x', value, (err, res) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve(res)
                })
            })
        }
    })

    it('should work with multi', (done) => {
        redisClient.multi()
            .sadd('x', 6)
            .srem('x', 7)
            .exec(() => {
                expect(records.length).to.eql(4)
                done()
            })
    })
})
