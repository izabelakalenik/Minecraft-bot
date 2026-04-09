const { goals } = require('mineflayer-pathfinder')
const { GoalNear } = goals

async function moveTo(bot, position) {
    return new Promise((resolve) => {
        bot.pathfinder.setGoal(
            new GoalNear(
                Math.floor(position.x),
                Math.floor(position.y),
                Math.floor(position.z),
                1
            )
        )

        bot.once('goal_reached', () => {
            resolve()
        })
    })
}

module.exports = moveTo