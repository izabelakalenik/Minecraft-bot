const moveTo = require('../movement/navigator')
const fight = require('./fight')

const PICKUP_RADIUS = 8
const SEARCH_TIMEOUT = 12000
const MAX_PICKUPS = 6

async function findFood(bot, decision) {
    switch (decision.source) {
        case 'animal':
            await huntAnimal(bot, decision)
            break
        case 'crop':
            await harvestCrop(bot, decision)
            break
        default:
            await searchForFood(bot)
    }
}

async function huntAnimal(bot, decision) {
    const animal = decision.target

    if (!animal || !animal.isValid) {
        console.log('[FindFood] No valid animal to hunt')
        return
    }

    console.log(`[FindFood] Hunting ${animal.name} for food`)

    await fight(bot, { target: animal })

    await collectNearbyDrops(bot)
}

async function harvestCrop(bot, decision) {
    const crop = decision.target

    if (!crop) {
        console.log('[FindFood] No crop target to harvest')
        return
    }

    console.log(`[FindFood] Harvesting ${crop.name}`)

    try {
        await moveTo(bot, crop.position.offset(1, 0, 0), 20000, 2)
        await bot.lookAt(crop.position.offset(0.5, 0.5, 0.5))

        const liveBlock = bot.blockAt(crop.position) || crop

        if (bot.canDigBlock(liveBlock)) {
            await bot.dig(liveBlock)
            await bot.waitForTicks(10)
        } else {
            console.log(`[FindFood] Cannot harvest ${liveBlock.name}`)
        }

        await collectNearbyDrops(bot)
    } catch (err) {
        console.log(`[FindFood] Harvest error: ${err.message}`)
    }
}

async function searchForFood(bot) {
    console.log('[FindFood] No food source nearby, wandering to search')

    const x = bot.entity.position.x + (Math.random() * 20 - 10)
    const y = bot.entity.position.y
    const z = bot.entity.position.z + (Math.random() * 20 - 10)

    try {
        await moveTo(bot, { x, y, z }, SEARCH_TIMEOUT, 2)
    } catch (err) {
        console.log(`[FindFood] Search wander failed: ${err.message}`)
    }
}

async function collectNearbyDrops(bot) {
    for (let i = 0; i < MAX_PICKUPS; i++) {
        const drop = Object.values(bot.entities).find(entity =>
            (entity.type === 'item' || entity.name === 'item') &&
            entity.position.distanceTo(bot.entity.position) < PICKUP_RADIUS
        )

        if (!drop) break

        try {
            await moveTo(bot, drop.position, SEARCH_TIMEOUT, 1)
            await bot.waitForTicks(6)
        } catch (err) {
            console.log(`[FindFood] Pickup failed: ${err.message}`)
            break
        }
    }
}

module.exports = findFood
