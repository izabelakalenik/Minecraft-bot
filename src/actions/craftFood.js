const craftItem = require('./craftItem')
const eatFood = require('./eatFood')

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
        return
    }

    const crafted = bot.inventory.items().find(item => item.name === foodName)

    if (crafted) {
        await eatFood(bot, { food: crafted, reason: decision.reason })
    } else {
        console.log(`[CraftFood] ${foodName} not found in inventory after crafting`)
    }
}

module.exports = craftFood
