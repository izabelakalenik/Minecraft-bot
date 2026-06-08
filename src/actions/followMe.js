const moveTo = require('../movement/navigator')
const buildBridge = require('./buildBridge')
const { blockingObstacleToward, findBridgeBlock } = require('../utils/terrain')

async function followMe(bot, username) {
    const player = bot.players[username]

    console.log(`[FollowMe] Present players: ${Object.keys(bot.players)}`)

    if (!player) {
        console.log(`[FollowMe] Player ${username} not found`)
        return
    }

    if (!player.entity) {
        console.log(`[FollowMe] Player ${username} is out of sight - trying to find them...`)
    }

    console.log(`[FollowMe] Following ${username}`)
    let attempts = 5
    let lastKnownPosition = player.entity ? player.entity.position : null
    
    while (attempts > 0) {
        const currentTargetPosition = player.entity ? player.entity.position : lastKnownPosition
        if (!currentTargetPosition) {
            console.log(`[FollowMe] No known position for ${username}`)
            break
        }

        if (player.entity) {
            lastKnownPosition = currentTargetPosition
            const distance = bot.entity.position.distanceTo(currentTargetPosition)
            if (distance <= 4) {
                console.log(`[FollowMe] Close to ${username} (${distance.toFixed(1)} blocks)`) 
                return
            }
            console.log(`[FollowMe] Player ${username} visible, distance: ${distance.toFixed(1)} blocks`)
        } else {
            console.log(`[FollowMe] Player ${username} out of sight, moving to last known position (${lastKnownPosition.x.toFixed(1)}, ${lastKnownPosition.y.toFixed(1)}, ${lastKnownPosition.z.toFixed(1)})`)
        }

        try {
            await moveTo(bot, currentTargetPosition, 45000, 3)
        } catch (err) {
            console.log(`[FollowMe] Follow attempt failed: ${err.message}`)

            if (/no ?path/i.test(err.message)) {
                const obstacle = blockingObstacleToward(bot, currentTargetPosition)
                if (obstacle && obstacle !== 'water' && findBridgeBlock(bot)) {
                    console.log(`[FollowMe] Blocked by ${obstacle}, bridging toward ${username}`)
                    await buildBridge(bot, {
                        target: {
                            x: currentTargetPosition.x,
                            y: currentTargetPosition.y,
                            z: currentTargetPosition.z
                        },
                        length: 6,
                        reason: `bridging toward ${username}`
                    })
                    await bot.waitForTicks(10)
                    attempts -= 1
                    continue
                }
            }

            break
        }

        await bot.waitForTicks(10)
        attempts -= 1
    }
}

module.exports = followMe