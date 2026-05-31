const moveTo = require('../movement/navigator')

async function swimMove(bot, decision = {}) {
    const targetDistance = decision.distance || 20
    
    console.log(`[SwimMove] Starting to swim (target distance: ${targetDistance})`)
    bot.chat('Swimming...')
    
    try {
        const startPos = bot.entity.position.clone()
        const yaw = bot.entity.yaw
        const dir = Math.round(yaw / (Math.PI / 2)) & 3
        
        const directions = [
            { x: 0, z: -1 }, // south
            { x: -1, z: 0 }, // west
            { x: 0, z: 1 },  // north
            { x: 1, z: 0 }   // east
        ]
        
        const offset = directions[dir]
        
        // Calculate target position ahead in swimming direction
        const targetPos = startPos.offset(offset.x * targetDistance, 0, offset.z * targetDistance)
        
        console.log(`[SwimMove] Swimming to ${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)}, ${targetPos.z.toFixed(1)}`)
        
        await moveTo(bot, targetPos, 30000, 2)
        
        console.log(`[SwimMove] Swim complete`)
    } catch (err) {
        console.log(`[SwimMove] Error while swimming: ${err.message}`)
        throw err
    }
}

module.exports = swimMove
