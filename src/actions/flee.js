const moveTo = require('../movement/navigator')

const FLEE_DISTANCES = [24, 18, 12, 8]
const FLEE_TIMEOUT = 15000
const FLEE_RANGE = 3
const MAX_THREATS_TO_AVOID = 5

async function flee(bot, decision) {
    console.log('[Flee] Finding safest direction')

    const rawThreats = getRawThreats(decision)
    const threats = getClosestThreats(bot, rawThreats)

    if (threats.length === 0) {
        console.log('[Flee] No threats found')
        return
    }

    console.log(
        `[Flee] Avoiding ${threats.length} closest threat(s): ` +
        threats.map(t => t.name).join(', ')
    )

    const safePosition = findBestFleePosition(bot, threats)

    if (!safePosition) {
        console.log('[Flee] No safe flee position found')
        return
    }

    try {
        console.log(
            `[Flee] Moving to ${safePosition.x.toFixed(1)}, ${safePosition.y.toFixed(1)}, ${safePosition.z.toFixed(1)}`
        )

        await moveTo(bot, safePosition, FLEE_TIMEOUT, FLEE_RANGE)

        console.log('[Flee] Escaped')
    } catch (err) {
        console.log(`[Flee] Escape failed: ${err.message}`)
    }
}

function getRawThreats(decision) {
    if (decision.threats && decision.threats.length > 0) {
        return decision.threats
    }

    if (decision.target) {
        return [decision.target]
    }

    return []
}

function getClosestThreats(bot, threats) {
    const botPos = bot.entity.position

    return threats
        .filter(threat =>
            threat &&
            threat.position &&
            isFinitePosition(threat.position)
        )
        .sort((a, b) =>
            botPos.distanceTo(a.position) -
            botPos.distanceTo(b.position)
        )
        .slice(0, MAX_THREATS_TO_AVOID)
}

function findBestFleePosition(bot, threats) {
    const botPos = bot.entity.position
    const baseAngle = getFleeAngle(bot, threats)

    const angleOffsets = [
        0,
        Math.PI / 8,
        -Math.PI / 8,
        Math.PI / 4,
        -Math.PI / 4,
        Math.PI / 2,
        -Math.PI / 2,
        Math.PI
    ]

    let bestCandidate = null
    let bestScore = -Infinity

    for (const distance of FLEE_DISTANCES) {
        for (const angleOffset of angleOffsets) {
            const angle = baseAngle + angleOffset

            const rawCandidate = botPos.offset(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            )

            if (!isFinitePosition(rawCandidate)) continue

            const candidate = findSafeStandingPositionNear(bot, rawCandidate)

            if (!candidate) continue

            const score = getFleeScore(candidate, threats)

            if (score > bestScore) {
                bestScore = score
                bestCandidate = candidate
            }
        }
    }

    return bestCandidate
}

function getFleeAngle(bot, threats) {
    const botPos = bot.entity.position

    let fleeX = 0
    let fleeZ = 0

    for (const threat of threats) {
        const dx = botPos.x - threat.position.x
        const dz = botPos.z - threat.position.z

        if (!Number.isFinite(dx) || !Number.isFinite(dz)) continue

        const distance = Math.sqrt(dx * dx + dz * dz)

        if (!Number.isFinite(distance) || distance <= 0) continue

        const weight = 1 / distance

        fleeX += (dx / distance) * weight
        fleeZ += (dz / distance) * weight
    }

    if (!Number.isFinite(fleeX) || !Number.isFinite(fleeZ)) {
        return bot.entity.yaw + Math.PI
    }

    if (Math.abs(fleeX) < 0.001 && Math.abs(fleeZ) < 0.001) {
        return bot.entity.yaw + Math.PI
    }

    return Math.atan2(fleeZ, fleeX)
}

function findSafeStandingPositionNear(bot, rawPosition) {
    const x = Math.floor(rawPosition.x)
    const z = Math.floor(rawPosition.z)
    const startY = Math.floor(bot.entity.position.y)

    for (let dy = 3; dy >= -4; dy--) {
        const pos = rawPosition.offset(
            x - rawPosition.x,
            startY + dy - rawPosition.y,
            z - rawPosition.z
        )

        if (isSafePosition(bot, pos)) {
            return pos
        }
    }

    return null
}

function getFleeScore(candidate, threats) {
    let minDistance = Infinity

    for (const threat of threats) {
        const distance = candidate.distanceTo(threat.position)

        if (Number.isFinite(distance) && distance < minDistance) {
            minDistance = distance
        }
    }

    return minDistance
}

function isSafePosition(bot, position) {
    if (!isFinitePosition(position)) return false

    const pos = position.floored()

    const feetBlock = bot.blockAt(pos)
    const headBlock = bot.blockAt(pos.offset(0, 1, 0))
    const groundBlock = bot.blockAt(pos.offset(0, -1, 0))

    if (!feetBlock || !headBlock || !groundBlock) return false

    return (
        isAir(feetBlock) &&
        isAir(headBlock) &&
        isSolidGround(groundBlock)
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

function isSolidGround(block) {
    const dangerous = [
        'water',
        'lava',
        'fire',
        'cactus',
        'magma_block'
    ]

    return (
        block &&
        !isAir(block) &&
        !dangerous.includes(block.name)
    )
}

function isFinitePosition(position) {
    return (
        position &&
        Number.isFinite(position.x) &&
        Number.isFinite(position.y) &&
        Number.isFinite(position.z)
    )
}

module.exports = flee