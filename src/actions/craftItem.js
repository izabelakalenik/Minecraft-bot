async function craftItem(bot, mcData, task) {
    const name = task.recipe
    const amount = task.amount || 1

    const item = mcData.itemsByName[name]
    if (!item) {
        throw new Error('Nieznany item: ' + name)
    }

    const recipes = bot.recipesFor(item.id, null, 1, null)
    if (!recipes || recipes.length === 0) {
        console.log(`Nie mam przepisu na ${name}`)
        return
    }

    await bot.craft(recipes[0], amount, null)
    console.log(`Crafted: ${name} x ${amount}`)
}

module.exports = craftItem