const craftItem = require('./craftItem')

async function craftFood(bot, decision) {
    const foodName = decision.food

    if (!foodName) {
        console.log('[CraftFood] No food to craft in decision')
        return
    }

    console.log(`[CraftFood] ${decision.reason}`)

    try {
        await craftItem(bot, foodName, 1)
    } catch (err) {
        console.log(`[CraftFood] Could not craft ${foodName}: ${err.message}`)
    }
}

module.exports = craftFood
