async function equipItem(bot, mcData, task) {
    const name = task.item
    const item = bot.inventory.items().find(i => i.name === name)

    if (!item) {
        console.log(`I don't have ${name} to equip.`)
        return
    }

    await bot.equip(item, 'hand')
    console.log(`Equipped: ${name}`)
}

module.exports = equipItem