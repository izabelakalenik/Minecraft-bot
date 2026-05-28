const MAX_STEPS = 10

async function leaveShelter(bot, mcData, decision) {
    console.log('[LeaveShelter] Leaving shelter with stairs')
    const startY = bot.entity.position.y

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

        await bot.waitForTicks(15)

        if (isOutside(bot, startY)) {
            console.log('[LeaveShelter] Left shelter')
            return
        }
    }

    console.log('[LeaveShelter] Could not leave shelter')
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

    const dx = Math.round(-Math.sin(yaw))
    const dz = Math.round(-Math.cos(yaw))

    return pos.offset(dx, 0, dz)
}

function isOutside(bot, startY) {
    const currentY = bot.entity.position.y

    const pos = bot.entity.position.floored()

    const roof = bot.blockAt(pos.offset(0, 2, 0))

    return (
        currentY >= startY + 2 &&
        isAir(roof)
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