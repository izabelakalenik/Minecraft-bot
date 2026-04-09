const { pathfinder, Movements } = require('mineflayer-pathfinder')
const mcData = require('minecraft-data')('1.16.5')

function setupPathfinder(bot) {
    bot.loadPlugin(pathfinder)

    const defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    return mcData
}

module.exports = setupPathfinder