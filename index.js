const weService = require('./services/weService');
const passwordEncryptionService = require("./services/passwordEncryptionService");
if (process.argv.length > 2) {
    const operation = process.argv[2]
    const password = passwordEncryptionService.encrypt(process.argv[4]);
    const msisdn = process.argv[3];
    const requestMsisdn = process.argv[5];
    if (operation === 'query')
        weService.fetchStatistics(msisdn, password, requestMsisdn).then(statistics => {
            console.log(statistics);
        }).catch(err => {
            console.error(err);
        });
    else if (operation === 'payment')
        weService.getPaymentUrl(msisdn, password, requestMsisdn).then(paymentUrl => {
            console.log(paymentUrl);
        }).catch(err => {
            console.error(err);
        });
    else
        console.error('Invalid operation');
} else {
    const express = require('express');
    const http = require('http');
    var app = express();
    app.get("/api/statistics", (req, res) => {
        const msisdn = req.query.msisdn;
        const password = passwordEncryptionService.encrypt(req.query.password);
        const requestMsisdn = req.query.requestMsisdn;
        console.log('Fetching statistics for ' + msisdn);
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
    const server = http.createServer(app)
    const port = process.env.PORT || 3000;
    server.listen(port);
    server.on('listening', () => {
        console.log('Listening on port ' + port);
    })
}