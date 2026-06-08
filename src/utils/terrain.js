// terrain detection for the obstacle / bridge decision logic.
// Minecraft forward vector: x = -sin(yaw), z = cos(yaw)

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

const BRIDGE_BLOCKS = ['cobblestone', 'dirt', 'stone', 'cobbled_deepslate', 'netherrack', 'gravel']

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
    findBridgeBlock,
    blockingObstacleToward,
    Vec3
}
