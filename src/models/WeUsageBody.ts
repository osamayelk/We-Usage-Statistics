export type WEUsageBody = {
    summarizedLineUsageList: {
        summaryGroupName: string, initialTotalAmount: number, usedAmount: number,
        freeAmount: number, usagePercentage: number }[],
    detailedLineUsageList: {
        itemCode: string, initialTotalAmount: number, usedAmount: number, freeAmount: number, usagePercentage: number, remainingDaysForRenewal: number,
        renewalDate: string, subscriptionDate: string
    }[]
}