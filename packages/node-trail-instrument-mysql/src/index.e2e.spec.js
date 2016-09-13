'use strict'

import {expect} from 'chai'
import mysql from 'mysql'
import agent from 'trail-agent'

import wrapper from '.'

describe('mysql e2e', () => {
    const DB = {
        host: '127.0.0.1',
        port: 3306,
        database: 'trail_test',
        user: 'root',
    }
    let records

    beforeEach(() => {
        records = []
        agent.setSampler(() => true)
        agent.setRecorder((span) => {
            records.push(span)
        })
        wrapper.wrap(agent, mysql)
    })

    afterEach(() => {
        wrapper.unwrap()
    })

    it('should record Connection.query', (done) => {
        let connection = mysql.createConnection(DB)
        connection.connect()
        let queryStr1 = 'select * from user'
        let queryStr2 = 'select * from not_exist_table'
        connection.query(queryStr1, (err1) => {
            expect(err1).to.not.exist
            connection.query(queryStr2, (err2) => {
                expect(err2).to.exist
                let [span1, span2] = records
                expect(span1.operationName).to.eql(queryStr1)
                expect(span1.tags.database).to.eql(DB.database)
                expect(span1.tags.status).to.eql(0)
                expect(span2.operationName).to.eql(queryStr2)
                expect(span2.tags.status).to.eql(1)
                done()
            })
        })
    })

    it('should record Pool.query', (done) => {
        let pool = mysql.createPool(DB)
        let queryStr = 'select * from user'
        pool.query(queryStr, (err) => {
            expect(err).to.not.exist
            let [span] = records
            expect(span.operationName).to.eql(queryStr)
            expect(span.tags.status).to.eql(0)
            done()
        })
    })
})
