const { GoalNear } = require('mineflayer-pathfinder').goals

async function moveTo(bot, position, timeout = 15000, range = 2) {
    if (!bot.pathfinder) {
        throw new Error('[Navigator] Pathfinder not loaded')
    }
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
        throw new Error('[Navigator] Invalid position')
    }

    return new Promise((resolve, reject) => {
        const distance = bot.entity?.position?.distanceTo(position) || 0
        const distanceTimeout = Math.ceil(distance * 1000) + 10000
        const effectiveTimeout = Math.max(timeout, distanceTimeout)

        const goal = new GoalNear(
            Math.floor(position.x),
            Math.floor(position.y),
            Math.floor(position.z),
            Math.floor(range) || 1
        )
        let lastPathStatus = null

        function cleanup() {
            clearTimeout(timer)
            bot.removeListener('goal_reached', onGoalReached)
            bot.removeListener('path_update', onPathUpdate)
        }

        function onGoalReached() {
            console.log(`[Navigator] Successfully reached target`)
            cleanup()
            resolve()
        }

        function onPathUpdate(result) {
            if (result?.status === 'noPath' || result?.status === 'failed') {
                console.log(`[Navigator] Not going to target - No path found: ${result.status}`)
                cleanup()
                reject(new Error(`[Navigator] No path: ${result.status}`))
            } else if (result?.status && result.status !== lastPathStatus) {
                lastPathStatus = result.status
                console.log(`[Navigator] Going to target at (${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}), status: ${result.status}`)
            }
        }

        let timer = setTimeout(() => {
            cleanup()
            bot.pathfinder.setGoal(null)
            console.log(`[Navigator] Not going to target - moveTo timeout`)
            reject(new Error('[Navigator] moveTo timeout'))
        }, effectiveTimeout)

        console.log(`[Navigator] Looking for target at (${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}) [distance: ${distance.toFixed(1)}, timeout: ${effectiveTimeout}ms]`)
        bot.on('goal_reached', onGoalReached)
        bot.on('path_update', onPathUpdate)
        bot.pathfinder.setGoal(goal)
    })
}

module.exports = moveTo