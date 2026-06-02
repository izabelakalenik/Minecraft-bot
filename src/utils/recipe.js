const minecraftData = require('minecraft-data')

function getMcData(bot) {
    return minecraftData(bot.version)
}

function getItemDef(bot, itemName) {
    if (!bot?.registry?.itemsByName) return null
    return bot.registry.itemsByName[itemName] || null
}

function getItemNameById(bot, itemId) {
    if (!bot?.registry?.itemsByName) return null

    const found = Object.values(bot.registry.itemsByName).find(def => def && def.id === itemId)
    return found?.name || null
}

function getRecipeCandidates(bot, itemName, craftingTable = null) {
    const itemDef = getItemDef(bot, itemName)
    if (!itemDef) return []

    const recipes = []
    const seen = new Set()

    function pushUnique(list) {
        for (const recipe of list || []) {
            const key = recipe?.id || JSON.stringify(recipe)
            if (seen.has(key)) continue
            seen.add(key)
            recipes.push(recipe)
        }
    }

    try {
        if (typeof bot.recipesAll === 'function') {
            pushUnique(bot.recipesAll(itemDef.id, null, craftingTable))
        }
    } catch {
        // ignore
    }

    try {
        if (typeof bot.recipesFor === 'function') {
            pushUnique(bot.recipesFor(itemDef.id, null, 1, craftingTable))
        }
    } catch {
        // ignore
    }

    return recipes
}

function recipeRequiresCraftingTable(recipe) {
    if (recipe?.requiresTable != null) {
        return Boolean(recipe.requiresTable)
    }

    if (Array.isArray(recipe?.inShape)) {
        if (recipe.inShape.length > 2) return true
        for (const row of recipe.inShape) {
            if (Array.isArray(row) && row.length > 2) return true
        }
    }

    return false
}

function getRecipeIngredientCounts(recipe) {
    const counts = new Map()

    function addRecipeItem(recipeItem) {
        if (!recipeItem) return

        const id = typeof recipeItem === 'number' ? recipeItem : recipeItem.id
        if (typeof id !== 'number') return

        const amount = typeof recipeItem?.count === 'number' ? recipeItem.count : 1
        counts.set(id, (counts.get(id) || 0) + amount)
    }

    if (Array.isArray(recipe?.ingredients)) {
        for (const ing of recipe.ingredients) {
            addRecipeItem(ing)
        }
    } else if (Array.isArray(recipe?.inShape)) {
        for (const row of recipe.inShape) {
            if (!Array.isArray(row)) continue
            for (const cell of row) {
                addRecipeItem(cell)
            }
        }
    }

    return counts
}

function getFirstMissingIngredientName(bot, recipe) {
    const counts = getRecipeIngredientCounts(recipe)

    for (const [itemId, needed] of counts.entries()) {
        const have = (bot?.inventory?.items?.() || [])
            .filter(item => item.type === itemId || item.id === itemId)
            .reduce((sum, item) => sum + item.count, 0)

        const name = getItemNameById(bot, itemId)

        if (!name || name === '-1' || itemId < 0) {
            continue
        }

        if (have < needed) {
            return name
        }
    }

    return null
}

function getRawSmeltTarget(bot, itemName) {
    if (!itemName.endsWith('_ingot')) return null
    if (itemName === 'netherite_ingot') return null

    const base = itemName.replace(/_ingot$/, '')
    const rawName = `raw_${base}`

    const mcData = getMcData(bot)
    if (mcData.itemsByName[rawName]) {
        return {
            inputItemName: rawName,
            outputItemName: itemName,
        }
    }

    return null
}

module.exports = {
    getItemDef,
    getItemNameById,
    getRecipeCandidates,
    recipeRequiresCraftingTable,
    getFirstMissingIngredientName,
    getRawSmeltTarget,
}