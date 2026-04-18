async function craftItem(bot, mcData, task) {
    const name = task.recipe
    const amount = task.amount || 1

    const item = mcData.itemsByName[name]
    if (!item) {
        throw new Error('Unknown item: ' + name)
    }

    const recipes = bot.recipesFor(item.id, null, 1, null)
    if (!recipes || recipes.length === 0) {
        console.log(`I don't have a recipe for ${name}`)
        return
    }

    await bot.craft(recipes[0], amount, null)
    console.log(`Crafted: ${amount} x ${name}`)
}

module.exports = craftItem