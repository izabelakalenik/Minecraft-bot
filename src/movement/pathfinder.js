const { pathfinder, Movements } = require('mineflayer-pathfinder')
const mcDataLoader = require('minecraft-data')

function setupPathfinder(bot) {
    bot.loadPlugin(pathfinder)

    const mcData = mcDataLoader(bot.version)

    const defaultMove = new Movements(bot, mcData)

    defaultMove.canDig = true
    defaultMove.allow1by1towers = false

    bot.pathfinder.setMovements(defaultMove)

    return mcData
}

module.exports = setupPathfinder