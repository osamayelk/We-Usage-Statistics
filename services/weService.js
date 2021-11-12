const axios = require("axios");
const nodeCache = require('node-cache');
const weCache = new nodeCache({stdTTL: 1200});
module.exports = {
    async fetchStatistics(msisdn, password) {
        let token = weCache.get('jwtToken');
        let loginInfo = weCache.get(msisdn + password)
        if (!token && !loginInfo) {
            token = await fetchJWTToken();
            let remainingTime =  getTokenExpiryInMilliseconds(token);
            weCache.set('jwtToken', token, remainingTime);
        }
        if (!loginInfo) {
            loginInfo = await login(token, password, msisdn);
            let remainingTime =  getTokenExpiryInMilliseconds(loginInfo.jwt);
            weCache.set(msisdn + password, loginInfo, remainingTime);
        }
        customerId = loginInfo.customerId;
        cookie = loginInfo.cookie;
        token = loginInfo.jwt;
        return await getUsage(token, msisdn, customerId, cookie);
    }
}

function getUsage(jwtToken, msisdn, customerId, cookie) {
    return new Promise((resolve, reject) => {
        let payload = {
            header: {
                msisdn: msisdn, locale: "en", customerId: customerId
            }
        };
        let config = {
            headers: {
                jwt: jwtToken,
                Cookie: cookie
            },
            withCredentials: true
        };
        axios.post('https://api-my.te.eg/api/line/freeunitusage', payload, config).then(res => {
            if (res.data.header.responseMessage.toLowerCase().indexOf("success") > -1) {
                const statistics = {
                    total: res.data.body.detailedLineUsageList[0].initialTotalAmount,
                    used: res.data.body.detailedLineUsageList[0].usedAmount,
                    remaining: res.data.body.detailedLineUsageList[0].freeAmount,
                    percentage: res.data.body.detailedLineUsageList[0].usagePercentage,
                    daysLeft: res.data.body.detailedLineUsageList[0].remainingDaysForRenewal,
                    expiryDate: res.data.body.detailedLineUsageList[0].renewalDate,
                    subscriptionDate: res.data.body.detailedLineUsageList[0].subscriptionDate
                }
                resolve(statistics);
            } else {
                reject(res.data.header.responseMessage);
            }
        }).catch(err => {
            reject(err);
        })
    })
}

function login(jwtToken, password, msisdn) {
    return new Promise((resolve, reject) => {
        let payload = {
            body: {password}, header: {
                msisdn, timestamp: new Date().getTime(), locale: "en"
            }
        };
        let config = {
            headers: {
                jwt: jwtToken
            },
            withCredentials: true
        };
        axios.post('https://api-my.te.eg/api/user/login?channelId=WEB_APP', payload, config).then(res => {
            if (res.data.header.responseMessage.indexOf('success') > -1) {
                customerId = res.data.header.customerId;
                const cookie = res.headers["set-cookie"];
                resolve({customerId: customerId, cookie, jwt: res.data.body.jwt});
            } else {
                reject(res.data.header.responseMessage);
            }
        }).catch(err => {
            reject(err);
        })
    })
}

function fetchJWTToken() {
    return new Promise((resolve, reject) => {
        axios.get("https://api-my.te.eg/api/user/generatetoken?channelId=WEB_APP").then(res => {
            let jwtToken = res.data.body.jwt;
            resolve(jwtToken);
        }).catch(err => {
            reject(err);
        });
    })
}

function getTokenExpiryInMilliseconds(token) {
    const decoded = decodeJWTTokenToObject(token);
    return (decoded.exp * 1000) - new Date().getTime();
}

function decodeJWTTokenToObject(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('ascii'));
}