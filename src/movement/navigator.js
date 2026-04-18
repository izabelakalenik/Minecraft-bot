const { GoalNear } = require('mineflayer-pathfinder').goals

async function moveTo(bot, position, timeout = 15000, range = 2) {
    if (!bot.pathfinder) {
        throw new Error('[Navigator] Pathfinder not loaded')
    }
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
        throw new Error('[Navigator] Invalid position')
    }

    return new Promise((resolve, reject) => {
        const goal = new GoalNear(
            Math.floor(position.x),
            Math.floor(position.y),
            Math.floor(position.z),
            Math.floor(range) || 1
        )

        function cleanup() {
            clearTimeout(timer)
            bot.removeListener('goal_reached', onGoalReached)
            bot.removeListener('path_update', onPathUpdate)
        }

        function onGoalReached() {
            cleanup()
            resolve()
        }

        function onPathUpdate(result) {
            if (result?.status === 'noPath' || result?.status === 'failed') {
                cleanup()
                reject(new Error(`[Navigator] No path: ${result.status}`))
            }
        }

        let timer = setTimeout(() => {
            cleanup()
            bot.pathfinder.setGoal(null)
            reject(new Error('[Navigator] moveTo timeout'))
        }, timeout)

        bot.on('goal_reached', onGoalReached)
        bot.on('path_update', onPathUpdate)
        bot.pathfinder.setGoal(goal)
    })
}

module.exports = moveTo