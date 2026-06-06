const craftItem = require('./craftItem')
const placeItem = require('./placeItem')


async function craftFurnace(bot, decision) {
    console.log(`[CraftFurnace] ${decision.reason}`)

    await craftItem(bot, 'furnace', 1)

    try {
        await placeItem(bot, { name: 'furnace', amount: 1 })
        console.log('[CraftFurnace] Placed furnace, ready to cook next cycle')
    } catch (err) {
        console.log(`[CraftFurnace] Could not place furnace: ${err.message}`)
    }
}

module.exports = craftFurnace
