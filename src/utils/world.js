function findNearestBlock(bot, blockNames, maxDistance = 64) {
    if (!bot?.findBlock) return null

    return bot.findBlock({
        matching: block => block && blockNames.includes(block.name),
        maxDistance,
    })
}

function findCraftingTable(bot) {
    if (!bot?.findBlock) return null

    return bot.findBlock({
        matching: block => block && block.name === 'crafting_table',
        maxDistance: 4,
    })
}

function findFurnace(bot) {
    if (!bot?.findBlock) return null

    return bot.findBlock({
        matching: block => block && block.name === 'furnace',
        maxDistance: 4,
    })
}

module.exports = {
    findNearestBlock,
    findCraftingTable,
    findFurnace,
}