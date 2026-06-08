const { pathfinder, Movements } = require('mineflayer-pathfinder')
const mcDataLoader = require('minecraft-data')

function setupPathfinder(bot) {
    bot.loadPlugin(pathfinder)

    const mcData = mcDataLoader(bot.version)

    const defaultMove = new Movements(bot, mcData)
    defaultMove.canDig = true
    defaultMove.allow1by1towers = true
    defaultMove.allowSprinting = true
    defaultMove.allowFreeMotion = false

    const lava = mcData.blocksByName.lava
    if (lava && defaultMove.blocksToAvoid && typeof defaultMove.blocksToAvoid.add === 'function') {
        defaultMove.blocksToAvoid.add(lava.id)
    }

    // a high cost makes the bot prefer dry routes (and reduces drowning), 
    // but it will still swim across when that is the only way to reach the goal
    defaultMove.liquidCost = 5

    bot.pathfinder.setMovements(defaultMove)

    bot.pathfinder.thinkTimeout = 20000

    return mcData
}

module.exports = setupPathfinder