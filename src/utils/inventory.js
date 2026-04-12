function printInventory(bot) {
    const items = bot.inventory.items()

    if (items.length === 0) {
        console.log('Ekwipunek pusty')
        return
    }

    console.log('\n🎒 Ekwipunek:')

    const grouped = {}

    for (const item of items) {
        if (!grouped[item.name]) grouped[item.name] = 0
        grouped[item.name] += item.count
    }

    for (const [name, count] of Object.entries(grouped)) {
        console.log(`- ${count}x ${name}`)
    }

    console.log('')
}

module.exports = printInventory