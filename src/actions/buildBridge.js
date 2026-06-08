const { findBridgeBlock, forwardCardinal, Vec3 } = require('../utils/terrain')

// place a block at the forward foot-1 position, step onto it, repeat;
// sneaks throughout so the bot can't walk off into the lava,
// and verifies each block actually landed before advancing
async function buildBridge(bot, decision) {
    console.log(`[BuildBridge] ${decision.reason}`)

    const length = decision.length || 5
    const { x: dx, z: dz } = forwardCardinal(bot)
    const face = new Vec3(dx, 0, dz)

    bot.setControlState('sneak', true)

    try {
        for (let i = 0; i < length; i++) {
            if (bot._aiAbort) break

            const block = findBridgeBlock(bot)
            if (!block) {
                console.log('[BuildBridge] Out of bridge blocks')
                break
            }

            const standPos = bot.entity.position.floored()
            const refBlock = bot.blockAt(standPos.offset(0, -1, 0)) // block under the bot
            if (!refBlock || refBlock.boundingBox !== 'block') {
                console.log('[BuildBridge] No solid block under bot, aborting')
                break
            }

            const targetPos = standPos.offset(dx, -1, dz)         // where the new block goes
            const ahead = bot.blockAt(targetPos)
            const needsFill = ahead && (ahead.name === 'air' || ahead.name === 'lava' || ahead.name === 'water')

            if (needsFill) {
                try {
                    await bot.equip(block, 'hand')
                    await bot.placeBlock(refBlock, face)
                } catch (err) {
                    console.log(`[BuildBridge] Place failed, aborting: ${err.message}`)
                    break
                }

                const placed = bot.blockAt(targetPos)
                if (!placed || placed.boundingBox !== 'block') {
                    console.log('[BuildBridge] Block not placed - aborting to avoid falling in')
                    break
                }
            }

            // step forward onto the (now solid) block ahead
            await bot.lookAt(standPos.offset(dx + 0.5, 0, dz + 0.5), true)
            bot.setControlState('forward', true)
            await bot.waitForTicks(8)
            bot.setControlState('forward', false)
        }
    } finally {
        bot.setControlState('forward', false)
        bot.setControlState('sneak', false)
    }

    console.log('[BuildBridge] Bridge attempt finished')
}

module.exports = buildBridge
