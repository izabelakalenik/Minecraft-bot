async function craftItem(bot, mcData, task) {
    const name = task.recipe
    const amount = task.amount || 1

    const item = mcData.itemsByName[name]
    if (!item) {
        throw new Error('[CraftItem] Unknown item: ' + name)
    }

    const recipes = bot.recipesFor(item.id, null, 1, null)
    if (!recipes || recipes.length === 0) {
        console.log(`[CraftItem] I don't have a recipe for ${name}`)
        return
    }

    await bot.craft(recipes[0], amount, null)
    console.log(`[CraftItem] Crafted: ${amount} x ${name}`)
}

module.exports = craftItem