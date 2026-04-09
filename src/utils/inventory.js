function printInventory(bot) {
    console.log('Ekwipunek: ')

    bot.inventory.items().forEach(item => {
        console.log(`${item.count}x ${item.name}`)
    })
}

module.exports = printInventory