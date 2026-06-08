const moveTo = require('../movement/navigator')

const DROP_SEARCH_RANGE = 8
const DEFAULT_RETRIES = 6
const MOVE_TIMEOUT = 12000

function isItemEntity(entity) {
    return (
        !!entity &&
        (entity.name === 'item' ||
            entity.type === 'item' ||
            entity.objectType === 'Item')
    )
}

function findNearestDrop(bot, pos, range = DROP_SEARCH_RANGE) {
    let closest = null
    let closestDist = range

    for (const id in bot.entities) {
        const entity = bot.entities[id]
        if (!isItemEntity(entity)) continue

        const dist = entity.position.distanceTo(pos)
        if (dist < closestDist) {
            closest = entity
            closestDist = dist
        }
    }

    return closest
}

async function collectDrops(bot, pos = bot.entity.position, options = {}) {
    const range = options.range ?? DROP_SEARCH_RANGE
    const retries = options.retries ?? DEFAULT_RETRIES

    for (let i = 0; i < retries; i++) {
        const drop = findNearestDrop(bot, pos, range)
        if (!drop) break

        try {
            await moveTo(bot, drop.position, MOVE_TIMEOUT, 0)
            await bot.waitForTicks(6)
        } catch (err) {
            console.log(`[Drops] Pickup move failed: ${err.message}`)
            break
        }
    }
}

module.exports = { collectDrops, findNearestDrop, isItemEntity }
