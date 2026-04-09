async function craftWoodenAxe(bot, mcData, printInventory) {
    const axeRecipe = bot.recipesFor(
        mcData.itemsByName['wooden_axe'].id,
        null,
        1,
        null
    )[0]

    if (!axeRecipe) {
        console.log('Nie mam przepisu')
        return
    }

    for (const ingredient of axeRecipe.ingredients) {
        const recipe = bot.recipesFor(ingredient.id, null, 1, null)[0]

        if (recipe) {
            await bot.craft(recipe, 1, null)
        }
    }

    await bot.craft(axeRecipe, 1, null)

    const axe = bot.inventory.items().find(i => i.name === 'wooden_axe')

    if (axe) await bot.equip(axe, 'hand')

    printInventory(bot)
}

module.exports = craftWoodenAxe