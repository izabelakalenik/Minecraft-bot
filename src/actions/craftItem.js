// actions/craftItem.js
const recipeFactory = require('prismarine-recipe')
const minecraftData = require('minecraft-data')
const mineBlock = require('./mineBlock')
const placeItem = require('./placeItem')
const moveTo = require('../movement/navigator')

const TABLE_SEARCH_DISTANCE = 64
const TABLE_REACH = 3

function normalizeName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/^minecraft:/, '')
}

function resolveEntry(mcData, name) {
    const normalized = normalizeName(name)
    return mcData.itemsByName[normalized] || mcData.blocksByName[normalized] || null
}

function getEntryName(mcData, id) {
    return mcData.items[id]?.name || mcData.blocks[id]?.name || `#${id}`
}

function getRecipeInputs(recipe) {
    // prefer delta because it is what prismarine-recipe documents for ingredient accounting
    const deltaInputs = (recipe.delta || []).filter(r => r && typeof r.count === 'number' && r.count < 0)
    if (deltaInputs.length) return deltaInputs

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
        return recipe.ingredients.filter(Boolean).map(r => ({
            id: r.id,
            count: r.count || 1
        }))
    }

    if (Array.isArray(recipe.inShape)) {
        const counts = new Map()
        for (const row of recipe.inShape) {
            for (const cell of row) {
                if (!cell) continue
                counts.set(cell.id, (counts.get(cell.id) || 0) + (cell.count || 1))
            }
        }
        return [...counts.entries()].map(([id, count]) => ({ id, count }))
    }

    return []
}

function describeRecipe(recipe, mcData) {
    const resultName = getEntryName(mcData, recipe.result.id)
    const resultCount = recipe.result.count || 1
    const inputs = getRecipeInputs(recipe)
        .map(i => `${Math.abs(i.count)} x ${getEntryName(mcData, i.id)}`)
        .join(', ')

    return `${resultCount} x ${resultName} | requiresTable=${Boolean(recipe.requiresTable)} | inputs=${inputs || 'none'}`
}

function pickBestRecipe(recipes) {
    if (!recipes || recipes.length === 0) return null

    return [...recipes].sort((a, b) => {
        const aInputs = getRecipeInputs(a).length
        const bInputs = getRecipeInputs(b).length
        if (aInputs !== bInputs) return aInputs - bInputs

        const aOut = a.result?.count || 1
        const bOut = b.result?.count || 1
        return bOut - aOut
    })[0]
}

async function ensureCraftingTable(bot, mcData, options = {}, stack = new Set()) {
    const tableBlock = mcData.blocksByName.crafting_table
    if (!tableBlock) return null

    const searchDistance = options.tableSearchDistance ?? TABLE_SEARCH_DISTANCE
    const findTable = () => bot.findBlock({ matching: tableBlock.id, maxDistance: searchDistance })

    const existing = findTable()
    if (existing) {
        try {
            console.log(`[Craft] Going to nearest crafting table at ${existing.position}`)
            await moveTo(bot, existing.position, 20000, TABLE_REACH)
            return existing
        } catch (err) {
            console.log(`[Craft] Could not reach nearest crafting table: ${err.message}`)
        }
    }

    const tableItem = mcData.itemsByName.crafting_table
    if (tableItem && bot.inventory.count(tableItem.id) >= 1) {
        console.log('[Craft] No table nearby, placing one from inventory')
        try {
            await placeItem(bot, { name: 'crafting_table', amount: 1 })
            const placed = findTable()
            if (placed) return placed
        } catch (err) {
            console.log(`[Craft] Could not place crafting table: ${err.message}`)
        }
    }

    console.log('[Craft] No table nearby or in inventory, crafting one')
    try {
        await craftItem(bot, 'crafting_table', 1, options, stack)
        await placeItem(bot, { name: 'crafting_table', amount: 1 })
    } catch (err) {
        console.log(`[Craft] Could not craft/place a crafting table: ${err.message}`)
        return null
    }

    return findTable()
}

async function craftItem(bot, itemName, amount = 1, options = {}, stack = new Set()) {
    const mcData = minecraftData(bot.version)
    const Recipe = recipeFactory(bot.version).Recipe

    const normalized = normalizeName(itemName)
    const entry = resolveEntry(mcData, normalized)

    if (!entry) {
        throw new Error(`[Craft] Unknown item or block: ${normalized}`)
    }

    const current = bot.inventory.count(entry.id)
    const remainingNeeded = Math.max(0, amount - current)

    if (remainingNeeded <= 0) {
        console.log(`[Craft] Already have ${current}/${amount} ${normalized}`)
        return
    }

    if (stack.has(normalized)) {
        throw new Error(`[Craft] Circular dependency detected while resolving ${normalized}`)
    }

    stack.add(normalized)

    try {
        // use prismarine-recipe for discovery, not Mineflayer's context-sensitive helpers
        let recipes = Recipe.find(entry.id, null) || []

        if (!recipes.length) {
            const block = mcData.blocksByName[normalized]
            if (block) {
                console.log(`[Craft] No recipe for ${normalized}; gathering block instead`)
                bot.chat(`Gathering ${normalized}`)
                await mineBlock(bot, mcData, {
                    blockName: normalized,
                    amount: remainingNeeded
                })
                return
            }

            throw new Error(`[Craft] No recipe or gather source for ${normalized}`)
        }

        let recipe = pickBestRecipe(recipes)

        console.log(`[Craft] Resolved recipe for ${normalized}: ${describeRecipe(recipe, mcData)}`)
        bot.chat(`Recipe: ${describeRecipe(recipe, mcData)}`)

        // only deal with a crafting table when the recipe actually needs one:
        // nearest nearby -> from inventory -> craft a new one
        const table = recipe.requiresTable
            ? await ensureCraftingTable(bot, mcData, options, stack)
            : null

        if (recipe.requiresTable && !table) {
            throw new Error(`[Craft] ${normalized} needs a crafting table but none could be obtained`)
        }

        const resultCount = recipe.result?.count || 1
        const craftsNeeded = Math.ceil(remainingNeeded / resultCount)

        for (const input of getRecipeInputs(recipe)) {
            const neededAmount = Math.abs(input.count) * craftsNeeded
            const inputName = getEntryName(mcData, input.id)

            console.log(`[Craft] Need ${neededAmount} x ${inputName} for ${normalized}`)
            await craftItem(bot, inputName, neededAmount, options, stack)
        }

        console.log(`[Craft] Crafting ${craftsNeeded} x ${normalized}`)
        await bot.craft(recipe, craftsNeeded, table)
    } finally {
        stack.delete(normalized)
    }
}

module.exports = craftItem