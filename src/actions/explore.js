const digResource = require('./digResource')

module.exports = async function exploreAction(bot, decision) {
    const resourceName = decision && decision.resourceName ? decision.resourceName : 'coal'
    const amount = decision && decision.amount ? decision.amount : 4

    console.log(`[Explore] Digging ${amount} x ${resourceName}`)
    try {
        await digResource(bot, resourceName, amount)
    } catch (err) {
        console.log(`[Explore] Error while digging: ${err.message}`)
    }
}
