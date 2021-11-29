const axios = require("axios");
const nodeCache = require('node-cache');
const weCache = new nodeCache({stdTTL: 1200});
module.exports = {
    async fetchStatistics(msisdn, password) {
        let token = weCache.get('jwtToken');
        let loginInfo = weCache.get(msisdn + password);
        if (!token && !loginInfo) {
            if (process.env.JWT) {
                token = process.env.JWT;
            }
            else token = await fetchJWTToken();
            let remainingTime = getTokenExpiryInMilliseconds(token);
            weCache.set('jwtToken', token, remainingTime);
        }
        if (!loginInfo) {
            loginInfo = await login(token, password, msisdn);
            let remainingTime = getTokenExpiryInMilliseconds(loginInfo.jwt);
            weCache.set(msisdn + password, loginInfo, remainingTime);
        }
        const customerId = loginInfo.customerId;
        const cookie = loginInfo.cookie;
        token = loginInfo.jwt;
        return getUsage(token, msisdn, customerId, cookie);
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
                var summary = res.data.body.summarizedLineUsageList.filter(item =>
                    item.summaryGroupName === 'ADSL_USAGE_PREPAID'
                )[0];
                var details = res.data.body.detailedLineUsageList.filter(item =>
                    item.itemCode === 'C_TED_Primary_Fixed_Data'
                )[0];
                const statistics = {
                    total: summary.initialTotalAmount,
                    used: summary.usedAmount,
                    remaining: summary.freeAmount,
                    percentage: summary.usagePercentage,
                    daysLeft: details.remainingDaysForRenewal,
                    expiryDate: details.renewalDate,
                    subscriptionDate: details.subscriptionDate
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
                const customerId = res.data.header.customerId;
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