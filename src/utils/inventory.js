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

module.exports = getInventory