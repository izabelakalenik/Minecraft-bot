const { Vec3 } = require('vec3')

const MAX_DIG_DOWN_LEVELS = 3

async function buildShelter(bot, decision) {
    console.log('[BuildShelter] Building shelter')

    if (isSurroundedByWalls(bot) && canPlaceRoof(bot)) {
        console.log('[BuildShelter] Already surrounded, placing roof only')
        await equipPlaceableBlock(bot)
        await placeRoof(bot)
        return
    }

    for (let i = 0; i < MAX_DIG_DOWN_LEVELS; i++) {
        if (isSurroundedByWalls(bot) && canPlaceRoof(bot)) {
            console.log('[BuildShelter] Surrounded and roof can be placed')
            break
        }

        const pos = bot.entity.position.floored()
        const blockBelow = bot.blockAt(pos.offset(0, -1, 0))

        if (!blockBelow || !bot.canDigBlock(blockBelow)) {
            console.log('[BuildShelter] Cannot dig down')
            return
        }

        const originalY = bot.entity.position.y

        await bot.dig(blockBelow)
        console.log('[BuildShelter] Digging down')

        await fallIntoHole(bot, originalY)
        await bot.waitForTicks(10)
    }

    if (!isSurroundedByWalls(bot)) {
        console.log('[BuildShelter] Could not create proper wall shelter')
        return
    }

    if (!canPlaceRoof(bot)) {
        console.log('[BuildShelter] Could not find reference block for roof')
        return
    }

    const equipped = await equipPlaceableBlock(bot)

    if (!equipped) {
        console.log('[BuildShelter] No block available after digging')
        return
    }

    const roofPlaced = await placeRoof(bot)

    if (!roofPlaced) {
        console.log('[BuildShelter] Shelter not finished')
        return
    }

    console.log('[BuildShelter] Shelter finished')
}

async function equipPlaceableBlock(bot) {
    const blockItem = findPlaceableBlock(bot)

    if (!blockItem) {
        return false
    }

    await bot.equip(blockItem, 'hand')
    return true
}

function isSurroundedByWalls(bot) {
    const pos = bot.entity.position.floored()

    const wallPositions = [
        // legs level
        pos.offset(1, 0, 0),
        pos.offset(-1, 0, 0),
        pos.offset(0, 0, 1),
        pos.offset(0, 0, -1),

        // head level
        pos.offset(1, 1, 0),
        pos.offset(-1, 1, 0),
        pos.offset(0, 1, 1),
        pos.offset(0, 1, -1),
    ]

    return wallPositions.every(blockPos => {
        const block = bot.blockAt(blockPos)
        return isSolidBlock(block)
    })
}

function canPlaceRoof(bot) {
    const pos = bot.entity.position.floored()
    const roofBlock = bot.blockAt(pos.offset(0, 2, 0))

    if (isSolidBlock(roofBlock)) return true

    return !!findRoofReferenceBlock(bot, pos)
}

async function placeRoof(bot) {
    const pos = bot.entity.position.floored()
    const roofBlock = bot.blockAt(pos.offset(0, 2, 0))

    if (isSolidBlock(roofBlock)) {
        console.log('[BuildShelter] Roof already exists')
        return true
    }

    const referenceBlock = findRoofReferenceBlock(bot, pos)

    if (!referenceBlock) {
        console.log('[BuildShelter] No reference block to place roof')
        return false
    }

    try {
        await bot.placeBlock(referenceBlock.block, referenceBlock.faceVector)
        return true
    } catch (err) {
        console.log(`[BuildShelter] Cannot place roof: ${err.message}`)
        return false
    }
}

function findRoofReferenceBlock(bot, pos) {
    const candidates = [
        {
            block: bot.blockAt(pos.offset(1, 2, 0)),
            faceVector: new Vec3(-1, 0, 0)
        },
        {
            block: bot.blockAt(pos.offset(-1, 2, 0)),
            faceVector: new Vec3(1, 0, 0)
        },
        {
            block: bot.blockAt(pos.offset(0, 2, 1)),
            faceVector: new Vec3(0, 0, -1)
        },
        {
            block: bot.blockAt(pos.offset(0, 2, -1)),
            faceVector: new Vec3(0, 0, 1)
        }
    ]

    return candidates.find(candidate =>
        isSolidBlock(candidate.block)
    )
}

function isSolidBlock(block) {
    return (
        block &&
        block.name !== 'air' &&
        block.name !== 'cave_air' &&
        block.name !== 'void_air' &&
        block.name !== 'water' &&
        block.name !== 'lava'
    )
}

function findPlaceableBlock(bot) {
    const allowed = [
        'dirt',
        'cobblestone',
        'stone',
        'oak_planks',
        'spruce_planks',
        'birch_planks'
    ]

    return bot.inventory.items().find(item =>
        allowed.includes(item.name)
    )
}

async function fallIntoHole(bot, originalY) {
    await bot.waitForTicks(10)

    if (bot.entity.position.y < originalY) {
        return
    }

    bot.setControlState('forward', true)
    await bot.waitForTicks(8)
    bot.setControlState('forward', false)
}

module.exports = buildShelter