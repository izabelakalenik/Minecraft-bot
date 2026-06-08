const moveTo = require('../movement/navigator')
const placeItem = require('./placeItem')
const { isBedOccupied, findNearestBed, findBedOccupant } = require('../utils/bed')
const { collectDrops } = require('../utils/drops')

const WAKE_RETRIES = 3

async function wakeOccupant(bot, bed) {
    const occupant = findBedOccupant(bot, bed)

    if (!occupant) {
        console.log('[Sleep] Bed is occupied but no occupant entity found')
        return false
    }

    const who = occupant.username || occupant.name || 'someone'
    console.log(`[Sleep] Bed occupied, waking up ${who}`)

    for (let i = 0; i < WAKE_RETRIES; i++) {
        try {
            await bot.lookAt(occupant.position.offset(0, occupant.height * 0.9, 0))
            await bot.activateEntity(occupant) // right-click the occupant
        } catch (err) {
            console.log(`[Sleep] Wake attempt failed: ${err.message}`)
        }

        await bot.waitForTicks(10)

        const current = bot.blockAt(bed.position)
        if (!isBedOccupied(current)) {
            console.log(`[Sleep] ${who} woke up, bed is free`)
            return true
        }
    }

    console.log('[Sleep] Could not wake the occupant')
    return false
}

async function collectBed(bot, bedName, dropPos) {
    await collectDrops(bot, dropPos)

    return bot.inventory.items().some(item => item.name === bedName)
}

// fallback: break the bed (kicks the sleeper out), pick it up and place it fresh
async function resetBed(bot, bed) {
    const bedName = bed.name
    const bedPos = bed.position

    console.log(`[Sleep] Breaking ${bedName} to free it`)

    try {
        await bot.dig(bot.blockAt(bedPos) || bed)
    } catch (err) {
        console.log(`[Sleep] Failed to break bed: ${err.message}`)
        return null
    }

    if (!(await collectBed(bot, bedName, bedPos))) {
        console.log('[Sleep] Could not pick up the bed')
        return null
    }

    try {
        await placeItem(bot, { name: bedName })
    } catch (err) {
        console.log(`[Sleep] Failed to place bed back: ${err.message}`)
        return null
    }

    const newBed = findNearestBed(bot)
    if (!newBed) {
        console.log('[Sleep] Placed bed but cannot find it')
        return null
    }

    console.log('[Sleep] Bed rebuilt')
    return newBed
}

async function sleep(bot, decision) {
    let bed = decision.bed

    if (!bed) {
        console.log('[Sleep] No bed provided')
        return
    }

    console.log('[Sleep] Going to bed')

    try {
        await moveTo(bot, bed.position, 15000, 2)

        // re-read the block now that we are next to it (state may be stale)
        bed = bot.blockAt(bed.position) || bed

        if (isBedOccupied(bed)) {
            const woke = await wakeOccupant(bot, bed)

            if (!woke) {
                bed = await resetBed(bot, bed)
                if (!bed) return
            }
        }

        await moveTo(bot, bed.position, 15000, 2)

        await bot.lookAt(
            bed.position.offset(0.5, 0.5, 0.5)
        )

        await bot.sleep(bed)
        console.log('[Sleep] Bot is sleeping')
    } catch (err) {
        console.log(`[Sleep] Cannot sleep: ${err.message}`)
    }
}

module.exports = sleep
