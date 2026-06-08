const craftItem = require('./craftItem')
const { fluidAhead, crossingTarget, Vec3 } = require('../utils/terrain')

const BOAT_WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak']

function boatNameForWood(wood) {
    return wood === 'bamboo' ? 'bamboo_raft' : `${wood}_boat`
}

// strip a planks/log/wood name down to its wood type, e.g. stripped_birch_log -> birch
function woodOf(name) {
    return name
        .replace('stripped_', '')
        .replace(/_planks$/, '')
        .replace(/_log$/, '')
        .replace(/_wood$/, '')
}

function countByName(bot, name) {
    return bot.inventory.items()
        .filter(i => i.name === name)
        .reduce((sum, i) => sum + i.count, 0)
}

function chooseBoatName(bot) {
    const items = bot.inventory.items()

    // a boat needs 5 planks of one type
    for (const it of items) {
        if (!it.name.endsWith('_planks')) continue
        const wood = woodOf(it.name)
        if ((BOAT_WOODS.includes(wood) || wood === 'bamboo') && countByName(bot, it.name) >= 5) {
            return boatNameForWood(wood)
        }
    }

    // 2 logs -> 8 planks, enough for a boat
    for (const it of items) {
        if (!it.name.endsWith('_log')) continue
        const wood = woodOf(it.name)
        if (BOAT_WOODS.includes(wood) && countByName(bot, it.name) >= 2) {
            return boatNameForWood(wood)
        }
    }

    const log = bot.findBlock({
        matching: b => b && b.name.endsWith('_log') && BOAT_WOODS.includes(woodOf(b.name)),
        maxDistance: 64
    })
    if (log) return boatNameForWood(woodOf(log.name))

    return 'oak_boat'
}

function findBoatItem(bot) {
    return bot.inventory.items().find(i => i.name.endsWith('_boat') || i.name.endsWith('_raft'))
}

function findBoatEntity(bot) {
    return bot.nearestEntity(e =>
        e && (e.name === 'boat' || e.displayName === 'Boat' ||
            /boat|raft/i.test(e.name || '') || /boat|raft/i.test(e.displayName || ''))
    )
}

async function crossByBoat(bot, decision) {
    console.log(`[CrossByBoat] ${decision.reason}`)

    // face the target so the boat is launched and paddled toward it
    if (decision.target) {
        const t = decision.target
        await bot.lookAt(new Vec3(t.x, bot.entity.position.y, t.z), true)
    }

    let boat = findBoatItem(bot)
    if (!boat) {
        const boatName = chooseBoatName(bot)
        console.log(`[CrossByBoat] Making a ${boatName}`)
        try {
            await craftItem(bot, boatName, 1)
        } catch (err) {
            console.log(`[CrossByBoat] Could not craft ${boatName}: ${err.message}`)
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

    const target = decision.target
        ? new Vec3(decision.target.x, decision.target.y, decision.target.z)
        : crossingTarget(bot, ['water'])
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
