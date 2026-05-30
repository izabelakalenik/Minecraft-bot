const moveTo = require('../movement/navigator')

const FLEE_DISTANCE = 20

async function flee(bot, decision) {
    const target = decision.target

    if (!target || !target.position) return

    console.log(`[Flee] Fleeing from ${target.name}`)

    const botPos = bot.entity.position
    const mobPos = target.position

    const dx = botPos.x - mobPos.x
    const dz = botPos.z - mobPos.z

    const length = Math.sqrt(dx * dx + dz * dz) || 1

    const fleePosition = botPos.offset(
        (dx / length) * FLEE_DISTANCE,
        0,
        (dz / length) * FLEE_DISTANCE
    )

    await moveTo(bot, fleePosition, 15000, 2)

    console.log('[Flee] Escaped')
}

module.exports = flee