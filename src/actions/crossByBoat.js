const craftItem = require('./craftItem')
const { fluidAhead, crossingTarget } = require('../utils/terrain')

function findBoatItem(bot) {
    return bot.inventory.items().find(i => i.name.endsWith('_boat'))
}

function findBoatEntity(bot) {
    return bot.nearestEntity(e =>
        e && (e.name === 'boat' || e.displayName === 'Boat' || /boat/i.test(e.name || ''))
    )
}

async function crossByBoat(bot, decision) {
    console.log(`[CrossByBoat] ${decision.reason}`)

    let boat = findBoatItem(bot)
    if (!boat) {
        try {
            await craftItem(bot, 'oak_boat', 1)
        } catch (err) {
            console.log(`[CrossByBoat] Could not craft a boat: ${err.message}`)
            return
        }
        boat = findBoatItem(bot)
    }
    if (!boat) {
        console.log('[CrossByBoat] No boat available, aborting')
        return
    }

    const water = fluidAhead(bot, ['water'], 4)
    if (!water) {
        console.log('[CrossByBoat] No water in front to launch the boat')
        return
    }

    try {
        await bot.equip(boat, 'hand')
        await bot.lookAt(water.position.offset(0.5, 1, 0.5), true)
        bot.activateItem()
        await bot.waitForTicks(10)
    } catch (err) {
        console.log(`[CrossByBoat] Could not launch boat: ${err.message}`)
        return
    }

    const boatEntity = findBoatEntity(bot)
    if (!boatEntity) {
        console.log('[CrossByBoat] Could not find the launched boat')
        return
    }
    try {
        bot.mount(boatEntity)
        await bot.waitForTicks(10)
    } catch (err) {
        console.log(`[CrossByBoat] Could not mount boat: ${err.message}`)
        return
    }

    const target = crossingTarget(bot, ['water'])
    const deadline = Date.now() + 30000

    try {
        while (Date.now() < deadline) {
            if (bot._aiAbort) break
            if (!bot.vehicle) break // dismounted on hitting land
            if (bot.entity.position.distanceTo(target) <= 2) break

            await bot.lookAt(target, true)
            bot.setControlState('forward', true)
            await bot.waitForTicks(10)
        }
    } finally {
        bot.setControlState('forward', false)
        try { bot.dismount() } catch (err) {}
    }

    console.log('[CrossByBoat] Boat crossing finished')
}

module.exports = crossByBoat
