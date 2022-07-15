const axios = require("axios");
const nodeCache = require('node-cache');
const weCache = new nodeCache({stdTTL: 1200});
module.exports = {
    async fetchStatistics(msisdn, password, requestMsisdn = null) {
        let {token, customerId, cookie} = await authorize(msisdn, password);
        return getUsage(token, requestMsisdn ? requestMsisdn : msisdn, customerId, cookie);
    },
    async getPaymentUrl(msisdn, password, requestMsisdn = null) {
        let {token, customerId, cookie} = await authorize(msisdn, password);
        const dueAmount = await getDueAmount(token, requestMsisdn ? requestMsisdn : msisdn, customerId, cookie);
        const hashCode = await payDueAmount(token, requestMsisdn ? requestMsisdn : msisdn, customerId, cookie, dueAmount);
        return `https://payments.tedata.net/net.tedata.topG.ui/ViewPaymentWidget?transactionHashCode=${hashCode}`;
    }
}

async function authorize(msisdn, password) {
    console.log('Logging in...');
    let token = weCache.get('jwtToken');
    let loginInfo = weCache.get(msisdn + password);
    if (!token && !loginInfo) {
        if (process.env.JWT) {
            token = process.env.JWT;
        } else token = await fetchJWTToken();
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
    return {token, customerId, cookie};
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
                var remainingDaysUntilRenewal = Math.ceil((new Date(details.renewalDate + " 23:59:59+02:00").getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const statistics = {
                    total: summary.initialTotalAmount,
                    used: summary.usedAmount,
                    remaining: summary.freeAmount,
                    percentage: summary.usagePercentage,
                    daysLeft: remainingDaysUntilRenewal,
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

function getDueAmount(jwtToken, msisdn, customerId, cookie) {
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
        axios.post('https://api-my.te.eg/api/services/due', payload, config).then(res => {
            if (res.data.header.responseMessage.toLowerCase().indexOf("success") > -1) {
                var totalAmount = res.data.body.totalAmount;
                resolve(totalAmount);
            } else {
                reject(res.data.header.responseMessage);
            }
        }).catch(err => {
            reject(err);
        });
    });
}

function payDueAmount(jwtToken, msisdn, customerId, cookie, dueAmount) {
    return new Promise((resolve, reject) => {
        let payload = {
            header: {
                msisdn: msisdn, locale: "en", customerId: customerId
            },
            body: {
                amount: dueAmount*1,
                redirectionURL: 'https://my.te.eg/payment/finalize-payment',
                sourceMobileNumber: msisdn,
                targetMobileNumber: msisdn
            }
        };
        let config = {
            headers: {
                Jwt: jwtToken,
                Cookie: cookie,
                Origin: 'https://my.te.eg',
                'Content-Type': 'application/json'
            }
        };
        axios.post('https://api-my.te.eg/api/payment/pay/unregisteredcard/initiate', payload, config).then(res => {
            if (res.data.header.responseMessage.toLowerCase().indexOf("success") > -1) {
                resolve(res.data.body.hashCode);
            } else {
                reject(res.data.header.responseMessage);
            }
        }).catch(err => {
            reject(err);
        });
    });
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
    console.log('Fetching JWT token...');
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