const minecraftData = require('minecraft-data')
const moveTo = require('../movement/navigator')
const eatFood = require('./eatFood')
const { FUEL_ITEMS, cookedNameFor } = require('../utils/meat')

const FURNACE_REACH = 3
const SMELT_TIMEOUT = 30_000
const POLL_INTERVAL_TICKS = 10

function findFuel(bot, mcData) {
    for (const fuelName of FUEL_ITEMS) {
        const item = bot.inventory.items().find(i => i.name === fuelName)
        if (item) {
            return mcData.itemsByName[fuelName] || null
        }
    }
    return null
}

async function cookMeat(bot, decision) {
    const mcData = minecraftData(bot.version)
    const meat = decision.meat
    const furnaceBlock = decision.furnace

    if (!meat || !furnaceBlock) {
        console.log('[CookMeat] Missing meat or furnace in decision')
        return
    }

    const fuel = findFuel(bot, mcData)
    if (!fuel) {
        console.log('[CookMeat] No fuel available, eating raw meat instead')
        await eatFood(bot, { food: meat, reason: decision.reason })
        return
    }

    await moveTo(bot, furnaceBlock.position, 20000, FURNACE_REACH)

    let furnace
    try {
        furnace = await bot.openFurnace(furnaceBlock)
    } catch (err) {
        console.log(`[CookMeat] Cannot open furnace: ${err.message}. Eating raw meat`)
        await eatFood(bot, { food: meat, reason: decision.reason })
        return
    }

    try {
        const meatType = mcData.itemsByName[meat.name]
        const count = bot.inventory.count(meatType.id)

        await furnace.putFuel(fuel.id, null, 1)
        await furnace.putInput(meatType.id, null, count)

        console.log(`[CookMeat] Smelting ${count} x ${meat.name}`)

        const cooked = await waitForOutput(bot, furnace)

        if (cooked) {
            await furnace.takeOutput()
            console.log(`[CookMeat] Cooked ${meat.name} -> ${cooked.name}`)
        } else {
            console.log('[CookMeat] Smelting timed out')
        }
    } catch (err) {
        console.log(`[CookMeat] Smelting error: ${err.message}`)
    } finally {
        furnace.close()
    }

    const cookedName = cookedNameFor(meat.name)
    const cooked = bot.inventory.items().find(i => i.name === cookedName)
    const toEat = cooked || bot.inventory.items().find(i => i.name === meat.name)

    if (toEat) {
        await eatFood(bot, { food: toEat, reason: decision.reason })
    }
}

async function waitForOutput(bot, furnace) {
    const deadline = Date.now() + SMELT_TIMEOUT

    while (Date.now() < deadline) {
        const output = furnace.outputItem()
        if (output) return output
        await bot.waitForTicks(POLL_INTERVAL_TICKS)
    }

    return furnace.outputItem()
}

module.exports = cookMeat
