import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import nodeCache from 'node-cache';
import {LoginInfo} from '../models/LoginInfo';
import {WEResponse} from '../models/WEResponse';
import {WEUsageBody} from '../models/WeUsageBody';
import {UsageStatistics} from '../models/UsageStatistics';

const weCache = new nodeCache({stdTTL: 1200});

class WeService {
    public async fetchStatistics(msisdn: string, password: string) {
        let token = weCache.get<string>('jwtToken');
        let loginInfo = weCache.get<LoginInfo>(msisdn + password);
        if (!token && !loginInfo) {
            if (process.env.JWT) {
                token = process.env.JWT;
            } else token = await this.fetchJWTToken();
            let remainingTime = this.getTokenExpiryInMilliseconds(token);
            weCache.set('jwtToken', token, remainingTime);
        }
        if (!loginInfo) {
            loginInfo = await this.login(token, password, msisdn);
            let remainingTime = this.getTokenExpiryInMilliseconds(loginInfo.jwt);
            weCache.set(msisdn + password, loginInfo, remainingTime);
        }
        const customerId = loginInfo.customerId;
        const cookie = loginInfo.cookie;
        token = loginInfo.jwt;
        return this.getUsage(token, msisdn, customerId, cookie);
    }

    private getUsage(jwtToken: string, msisdn: string, customerId: number, cookie: string[]): Promise<UsageStatistics> {
        return new Promise((resolve, reject) => {
            let payload = {
                header: {
                    msisdn: msisdn, locale: "en", customerId: customerId
                }
            };
            let config: AxiosRequestConfig = {
                headers: {
                    jwt: jwtToken,
                    Cookie: cookie.join(';')
                },
                withCredentials: true
            };
            axios.post('https://api-my.te.eg/api/line/freeunitusage', payload, config).then(
                (res: AxiosResponse<WEResponse<{ responseMessage: string }, WEUsageBody>>) => {
                    if (res.data.header.responseMessage.toLowerCase().indexOf("success") > -1) {
                        let summary = res.data.body.summarizedLineUsageList.filter(item =>
                            item.summaryGroupName === 'ADSL_USAGE_PREPAID'
                        )[0];
                        let details = res.data.body.detailedLineUsageList.filter(item =>
                            item.itemCode === 'C_TED_Primary_Fixed_Data'
                        )[0];
                        const statistics: UsageStatistics = {
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

    private login(jwtToken: string, password: string, msisdn: string): Promise<LoginInfo> {
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
            axios.post<WEResponse<{ customerId: number, responseMessage: string }, { jwt: string }>>('https://api-my.te.eg/api/user/login?channelId=WEB_APP', payload, config).then(res => {
                if (res.data.header.responseMessage.indexOf('success') > -1) {
                    const customerId = res.data.header.customerId;
                    const cookie = res.headers["set-cookie"];
                    resolve({customerId, cookie, jwt: res.data.body.jwt});
                } else {
                    reject(res.data.header.responseMessage);
                }
            }).catch(err => {
                reject(err);
            })
        })
    }

    private fetchJWTToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            axios.get<WEResponse<never, { jwt: string }>>("https://api-my.te.eg/api/user/generatetoken?channelId=WEB_APP").then(res => {
                let jwtToken = res.data.body.jwt;
                resolve(jwtToken);
            }).catch(err => {
                reject(err);
            });
        })
    }

    private getTokenExpiryInMilliseconds(token: string): number {
        const decoded = this.decodeJWTTokenToObject(token);
        return (decoded.exp * 1000) - new Date().getTime();
    }

    private decodeJWTTokenToObject(token: string): { exp: number } {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('ascii'));
    }
}

export = WeService;