const LOG_VARIANTS = [
    'oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log',
    'dark_oak_log', 'mangrove_log', 'cherry_log',
    'crimson_stem', 'warped_stem',
    'oak_wood', 'spruce_wood', 'birch_wood', 'jungle_wood', 'acacia_wood',
    'dark_oak_wood', 'mangrove_wood', 'cherry_wood',
    'crimson_hyphae', 'warped_hyphae',
]

function isLogVariant(name) {
    return LOG_VARIANTS.includes(name)
}

function matchesTarget(itemName, targetName) {
    if (targetName === 'logs') return isLogVariant(itemName)
    if (targetName === 'cobblestone') return itemName === 'cobblestone'
    if (targetName === 'stone') return itemName === 'stone'
    return itemName === targetName
}

function countItemsByName(bot, targetName) {
    const items = bot?.inventory?.items?.() || []
    return items
        .filter(item => matchesTarget(item.name, targetName))
        .reduce((sum, item) => sum + item.count, 0)
}

function hasEnough(bot, targetName, amount = 1) {
    return countItemsByName(bot, targetName) >= amount
}


function getInventory(bot) {
    const items = bot.inventory.items()

    if (items.length === 0) {
        return 'Inventory is empty'
    }

    const grouped = {}

    for (const item of items) {
        if (!grouped[item.name]) {
            grouped[item.name] = 0
        }

        grouped[item.name] += item.count
    }

    const title = ['Inventory: ']
    let content = []
    for (const [name, count] of Object.entries(grouped)) {
        content.push(`${count} x ${name}`)
    }
    content = content.join(', ')
    return title + content
}

module.exports = {
    countItemsByName,
    hasEnough,
    getInventory
}