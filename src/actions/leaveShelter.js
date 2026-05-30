const MAX_STEPS = 3

async function leaveShelter(bot, decision) {
    console.log('[LeaveShelter] Leaving shelter with stairs')

    for (let i = 0; i < MAX_STEPS; i++) {
        const pos = bot.entity.position.floored()

        // 1. kopie dach nad sobą
        const roofBlock = bot.blockAt(pos.offset(0, 2, 0))
        await digIfPossible(bot, roofBlock, 'roof')

        // 2. kopie blok przed sobą na wysokości głowy i jeden blok wyżej
        const frontPos = getFrontPosition(bot)

        const frontHeadBlock = bot.blockAt(frontPos.offset(0, 1, 0))
        const frontUpperBlock = bot.blockAt(frontPos.offset(0, 2, 0))

        await digIfPossible(bot, frontHeadBlock, 'front head')
        await digIfPossible(bot, frontUpperBlock, 'front upper')

        await bot.waitForTicks(5)

        // 3. wskakuje do przodu
        bot.setControlState('jump', true)
        bot.setControlState('forward', true)

        await bot.waitForTicks(5)
        stopMoving(bot)
    }
    stopMoving(bot)
    console.log('[LeaveShelter] Could not leave shelter')
}

function stopMoving(bot) {
    bot.setControlState('jump', false)
    bot.setControlState('forward', false)
}

async function digIfPossible(bot, block, label) {
    if (!block) return
    if (isAir(block)) return

    if (!bot.canDigBlock(block)) {
        console.log(`[LeaveShelter] Cannot dig ${label}`)
        return
    }

    await bot.dig(block)
    console.log(`[LeaveShelter] Dug ${label}`)
}

function getFrontPosition(bot) {
    const pos = bot.entity.position.floored()

    const yaw = bot.entity.yaw
    const dir = Math.round(yaw / (Math.PI / 2)) & 3

    const offsets = [
        { x: 0, z: -1 }, // south
        { x: -1, z: 0 }, // west
        { x: 0, z: 1 }, // north
        { x: 1, z: 0 } // east
    ]

    return pos.offset(
        offsets[dir].x,
        0,
        offsets[dir].z
    )
}


function isAir(block) {
    return (
        !block ||
        block.name === 'air' ||
        block.name === 'cave_air' ||
        block.name === 'void_air'
    )
}

module.exports = leaveShelter