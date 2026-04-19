const moveTo = require('../movement/navigator')

async function followMe(bot, mcData, task) {
    const username = task.username
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
            break
        }

        await bot.waitForTicks(10)
        attempts -= 1
    }
}

module.exports = followMe