const weService = require('./services/weService');
const passwordEncryptionService = require("./services/passwordEncryptionService");
if (process.argv.length > 2) {
    const password = passwordEncryptionService.encrypt(process.argv[3]);
    const msisdn = process.argv[2];
    weService.fetchStatistics(msisdn, password).then(statistics => {
        console.log(statistics);
    });
} else {
    const express = require('express');
    const http = require('http');
    var app = express();
    app.get("/api/statistics", (req, res) => {
        const msisdn = req.query.msisdn;
        const password = passwordEncryptionService.encrypt(req.query.password);
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