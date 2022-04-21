"use strict";

const database = require('better-sqlite3')

const logdb = new database('log.db')

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get();
if (row == undefined) {
    console.log(`Your database appears to be empty. I will initialize it now.`)

    const logdata = 
    ` CREATE TABLE accesslog ( 
        id INTEGER PRIMARY KEY, 
        remoteaddr VARCHAR, 
        remoteuser VARCHAR, 
        time VARCHAR, 
        method VARCHAR, 
        url VARCHAR, 
        protocol VARCHAR,
        httpversion NUMERIC,  
        status INTEGER, 
        referer VARCHAR,
        useragent VARCHAR
    )`

    logdb.exec(logdata)
    console.log('Your database has been initialized with a new table.');
} else {
    console.log('Database exists.')
}

module.exports = logdb
