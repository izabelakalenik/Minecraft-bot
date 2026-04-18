const moveTo = require('../movement/navigator')

async function followMe(bot, mcData, task) {
    const username = task.username
    const player = bot.players[username]

    console.log(`[FollowMe] Present players: ${Object.keys(bot.players)}`)

    if (!player || !player.entity) {
        console.log(`[FollowMe] I don't see player ${username}`)
        return
    }

    console.log(`[FollowMe] Following ${username}`)
    let attempts = 5
    while (attempts > 0) {
        if (!player.entity) break
        const target = player.entity.position
        const distance = bot.entity.position.distanceTo(target)
        if (distance <= 4) {
            console.log(`[FollowMe] Close to ${username} (${distance.toFixed(1)} blocks)`) 
            return
        }

        try {
            await moveTo(bot, target, 12000, 3)
        } catch (err) {
            console.log(`[FollowMe] Follow attempt failed: ${err.message}`)
            break
        }

        await bot.waitForTicks(10)
        attempts -= 1
    }
}

module.exports = followMe