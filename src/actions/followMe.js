const moveTo = require('../movement/navigator')

async function followMe(bot, mcData, task) {
    const username = task.username
    const player = bot.players[username]

    console.log(`Present players: ${Object.keys(bot.players)}`)

    if (!player || !player.entity) {
        console.log(`I don't see player ${username}`)
        return
    }

    const target = player.entity.position

    console.log(`Following ${username}`)
    try {
        await moveTo(bot, {
            x: target.x,
            y: target.y,
            z: target.z
        }, 10000, 2)

        console.log(`Reached ${username}`)
    } catch (err) {
        console.log(`Error: ${err.message}`)
    }
}

module.exports = followMe