const weService = require('./services/weService');
const passwordEncryptionService = require("./services/passwordEncryptionService");
if (process.argv.length > 2) {
    const password = passwordEncryptionService.encrypt(process.argv[3]);
    const msisdn = process.argv[2];
    const requestMsisdn = process.argv[4];
    weService.fetchStatistics(msisdn, password, requestMsisdn).then(statistics => {
        console.log(statistics);
    }).catch(err => {
        console.error(err);
    });
} else {
    const express = require('express');
    const http = require('http');
    var app = express();
    app.get("/api/statistics", (req, res) => {
        const msisdn = req.query.msisdn;
        const password = passwordEncryptionService.encrypt(req.query.password);
        const requestMsisdn = req.query.requestMsisdn;
        weService.fetchStatistics(msisdn, password, requestMsisdn).then(statistics => {
            res.status(200).send(statistics);
        }).catch(err => {
            res.status(500).send(err);
        })
    });
    app.get("/api/payment", (req, res) => {
        const msisdn = req.query.msisdn;
        const password = passwordEncryptionService.encrypt(req.query.password);
        const requestMsisdn = req.query.requestMsisdn;
        weService.getPaymentUrl(msisdn, password, requestMsisdn).then(paymentUrl => {
            res.status(200).redirect(paymentUrl);
        }).catch(err => {
            res.status(500).send(err);
        });
    })
    const server = http.createServer(app);
    server.listen(3000);
    server.on('listening', () => {
        console.log('Listening on port 3000');
    })
}