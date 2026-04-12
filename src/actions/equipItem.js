async function equipItem(bot, mcData, task) {
    const name = task.item
    const item = bot.inventory.items().find(i => i.name === name)

    if (!item) {
        console.log(`Nie mam ${name} do wzięcia.`)
        return
    }

    await bot.equip(item, 'hand')
    console.log(`Wzięto: ${name}`)
}

module.exports = equipItem