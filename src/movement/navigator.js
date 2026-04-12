const { GoalNear } = require('mineflayer-pathfinder').goals

async function moveTo(bot, position, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const goal = new GoalNear(
            Math.floor(position.x),
            Math.floor(position.y),
            Math.floor(position.z),
            2
        )
        bot.pathfinder.setGoal(goal)
        const timer = setTimeout(() => {
            bot.pathfinder.setGoal(null)
            reject(new Error("moveTo timeout"))
        }, timeout)

        const onUpdate = (result) => {
            if (result.status === 'arrived') {
                clearTimeout(timer)
                bot.removeListener('path_update', onUpdate)
                resolve()
            }
        }

        bot.on('path_update', onUpdate)
    })
}

module.exports = moveTo