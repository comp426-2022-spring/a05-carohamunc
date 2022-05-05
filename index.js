// Place your server entry point code here
const express = require('express')
const app = express()

const db = require('./src/services/database.js')

const morgan = require('morgan')
//const errorhandler = require('errorhandler')
const fs = require('fs')

const args = require("minimist")(process.argv.slice(2))
// Make Express use its own built-in body parser to handle JSON
app.use(express.json());
args["port"]

const port = args.port || process.env.PORT || 5000

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port))
});

app.use( (req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }

    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    next()

    })

if (args.log == true) {
// Create a write stream to append (flags: 'a') to a file
  const WRITESTREAM = fs.createWriteStream('access.log', { flags: 'a' })
// Set up the access logging middleware
  app.use(morgan('combined', { stream: WRITESTREAM }))
}

if (args.debug == true) {
    app.get('/app/log/access', (req, res) => {	
        try {
            const stmt = db.prepare('SELECT * FROM accesslog').all()
            res.status(200).json(stmt)
        } catch {
            console.error(e)
        }
    });

    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.');
    });
}

// Serve static HTML files
app.use(express.static('./public'));
app.get("/app/", (req, res, next) => {
    // Respond with status 200
    res.statusCode = 200;
    // Respond with status message "OK"
    res.statusMessage = 'Your API works! ' + res.statusCode;
    res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
    res.end(res.statusCode+ ' ' +res.statusMessage)
});

function coinFlip() {
    var x = Math.round(Math.random());
    if (x < 1) {return "heads";} else {return "tails";}
  
  }

  function coinFlips(flips) {
    var arr = [];
    for (let i = 0; i < flips; i++) {
      arr[i] = coinFlip();
    }
    return arr;
  }

  function countFlips(array) {
    let h = 0;
    let t = 0;
    for (let i = 0; i < array.length; i++) {
      if (array[i] == "heads") {
        h++;
      } else {
        t++;
      }
    }
    return {heads: h, tails: t};
  }

  function flipACoin(call) {
    let flip = coinFlip();
    if (flip == call) {
      return {"call": call, "flip": flip, "result": "win"}; 
    } else {
      return {"call": call, "flip": flip, "result": "lose"}; 
    }
  }

app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});

//from a03/a04
    app.get('/app/flip/', (req, res) => {
        const flip = coinFlip()
        res.status(200).json({'flip' : flip})
    });
    
    app.get('/app/flips/:number/', (req, res) => {
        const flips = coinFlips(req.body.number)
        const count = countFlips(flips)
        res.status(200).json({'raw' : flips, 'summary' : count})
    });

    app.post('/app/flip/call/heads', (req, res) => {
        res.status(200).json(flipACoin("heads"))
    });

    app.post('/app/flip/call/tails', (req, res) => {
        res.status(200).json(flipACoin("tails"))
    });

    process.on('SIGINT', () => {
      server.close(() => {
      console.log('\nApp stopped.');
    });
    
  });