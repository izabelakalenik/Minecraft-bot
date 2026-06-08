// terrain detection for the water/lava decision tree;
// direction is taken from the bot's facing (where it is heading while exploring);
// minecraft forward vector: x = -sin(yaw), z = cos(yaw)

const { Vec3 } = require('vec3')

// dominant cardinal unit offset the bot is facing
function forwardCardinal(bot) {
    const yaw = bot.entity.yaw
    const fx = -Math.sin(yaw)
    const fz = Math.cos(yaw)

    if (Math.abs(fx) >= Math.abs(fz)) {
        return { x: fx >= 0 ? 1 : -1, z: 0 }
    }
    return { x: 0, z: fz >= 0 ? 1 : -1 }
}

function blockNameAt(bot, base, dx, dz, i, dy) {
    const block = bot.blockAt(base.offset(dx * i, dy, dz * i))
    return block ? block.name : null
}

// first matching fluid block ahead (foot + body level), or null
function fluidAhead(bot, names, distance = 4) {
    const { x: dx, z: dz } = forwardCardinal(bot)
    const base = bot.entity.position.floored()

    for (let i = 1; i <= distance; i++) {
        for (const dy of [0, 1]) {
            const block = bot.blockAt(base.offset(dx * i, dy, dz * i))
            if (block && names.includes(block.name)) return block
        }
    }
    return null
}

// how many blocks wide the fluid run ahead is (along the facing direction)
function fluidWidth(bot, names, maxScan = 48) {
    const { x: dx, z: dz } = forwardCardinal(bot)
    const base = bot.entity.position.floored()

    let i = 1
    while (i <= maxScan && !names.includes(blockNameAt(bot, base, dx, dz, i, 0))) i++

    let width = 0
    while (i <= maxScan && names.includes(blockNameAt(bot, base, dx, dz, i, 0))) {
        width++
        i++
    }
    return width
}

// a standable position just past the fluid (so the pathfinder swims across to land)
function crossingTarget(bot, names, maxScan = 64) {
    const { x: dx, z: dz } = forwardCardinal(bot)
    const base = bot.entity.position.floored()

    let i = 1
    while (i <= maxScan && !names.includes(blockNameAt(bot, base, dx, dz, i, 0))) i++
    while (i <= maxScan && names.includes(blockNameAt(bot, base, dx, dz, i, 0))) i++

    return base.offset(dx * i, 0, dz * i)
}

const BRIDGE_BLOCKS =['cobblestone', 'dirt', 'stone', 'cobbled_deepslate', 'netherrack', 'gravel']

function findBridgeBlock(bot) {
    for (const name of BRIDGE_BLOCKS) {
        const item = bot.inventory.items().find(i => i.name === name)
        if (item) return item
    }
    return null
}

// what blocks the straight line from the bot toward `target`:
// 'lava' | 'water' | 'gap' | null
function blockingObstacleToward(bot, target, distance = 4) {
    const dx0 = target.x - bot.entity.position.x
    const dz0 = target.z - bot.entity.position.z
    const dx = Math.abs(dx0) >= Math.abs(dz0) ? Math.sign(dx0) : 0
    const dz = dx === 0 ? Math.sign(dz0) : 0
    if (dx === 0 && dz === 0) return null

    const base = bot.entity.position.floored()
    for (let i = 1; i <= distance; i++) {
        for (const dy of [0, 1]) {
            const block = bot.blockAt(base.offset(dx * i, dy, dz * i))
            if (block && block.name === 'lava') return 'lava'
            if (block && block.name === 'water') return 'water'
        }
        const floor = bot.blockAt(base.offset(dx * i, -1, dz * i))
        if (floor && floor.name === 'air') return 'gap'
    }
    return null
}

module.exports = {
    forwardCardinal,
    fluidAhead,
    fluidWidth,
    crossingTarget,
    findBridgeBlock,
    blockingObstacleToward,
    Vec3
}
