const moveTo = require('../movement/navigator')

async function followMe(bot, mcData, task) {
    const username = task.username
    const player = bot.players[username]

    console.log(`Obecni gracze: ${Object.keys(bot.players)}`)

    if (!player || !player.entity) {
        console.log(`❌  Nie widzę gracza: ${username}`)
        return
    }

    const target = player.entity.position

    console.log(`🚶 Idę do ${username}`)
    try {
        await moveTo(bot, {
            x: target.x,
            y: target.y,
            z: target.z
        }, 10000, 2)

        console.log(`✅ Dotarłem do ${username}`)
    } catch (err) {
        console.log(`❌ Błąd followMe: ${err.message}`)
    }
}

module.exports = followMe