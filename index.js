const weService = require('./services/weService');
if (process.argv.length > 2) {
    weService.fetchStatistics(process.argv[2], process.argv[3]).then(statistics => {
        console.log(statistics);
    });
} else {
    const express = require('express');
    const http = require('http');
    var app = express();
    app.get("/api/statistics", (req, res) => {
        const msisdn = req.query.msisdn;
        const password = req.query.password;
        weService.fetchStatistics(msisdn, password).then(statistics => {
            res.status(200).send(statistics);
        }).catch(err => {
            res.status(500).send(err);
        })
    });
    const server = http.createServer(app);
    server.listen(3000);
    server.on('listening', () => {
        console.log('Listening on port 3000');
    })
}