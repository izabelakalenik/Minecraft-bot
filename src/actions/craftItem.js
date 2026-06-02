// actions/craftItem.js
const minecraftData = require('minecraft-data')
const mineBlock = require('./mineBlock')
const placeItem = require('./placeItem')

function normalizeName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/^minecraft:/, '')
}

function getMcEntryName(mcData, id) {
    return mcData.items[id]?.name || mcData.blocks[id]?.name || `#${id}`
}

function resolveEntry(mcData, name) {
    const normalized = normalizeName(name)
    return mcData.itemsByName[normalized] || mcData.blocksByName[normalized] || null
}

function recipeToString(recipe, mcData) {
    const resultName = getMcEntryName(mcData, recipe.result.id)
    const resultCount = recipe.result.count || 1

    const inputs = (recipe.delta || [])
        .filter(r => r && typeof r.count === 'number' && r.count < 0)
        .map(r => `${Math.abs(r.count)} x ${getMcEntryName(mcData, r.id)}`)

    return [
        `${resultCount} x ${resultName}`,
        `requiresTable=${Boolean(recipe.requiresTable)}`,
        inputs.length ? `inputs=${inputs.join(', ')}` : 'inputs=none'
    ].join(' | ')
}

function pickRecipe(bot, itemId, craftingTable = null) {
    let recipes = []

    try {
        recipes = bot.recipesFor(itemId, null, 1, craftingTable) || []
    } catch (err) {
        recipes = []
    }

    if (!recipes.length) {
        try {
            recipes = bot.recipesAll(itemId, null, craftingTable) || []
        } catch (err) {
            recipes = []
        }
    }

    return recipes[0] || null
}

async function findOrPlaceCraftingTable(bot, mcData, options = {}) {
    const tableBlock = mcData.blocksByName.crafting_table
    if (!tableBlock) return null

    const searchDistance = options.tableSearchDistance ?? 8

    let table = bot.findBlock({
        matching: tableBlock.id,
        maxDistance: searchDistance
    })

    if (table) return table

    const tableItem = mcData.itemsByName.crafting_table
    if (!tableItem) return null

    if (bot.inventory.count(tableItem.id) < 1) return null

    try {
        await placeItem(bot, {
            name: 'crafting_table',
            amount: 1
        })
    } catch (err) {
        console.log(`[Craft] Could not place crafting table: ${err.message}`)
    }

    table = bot.findBlock({
        matching: tableBlock.id,
        maxDistance: searchDistance
    })

    return table || null
}

async function craftItem(bot, itemName, amount = 1, options = {}, stack = new Set()) {
    const mcData = minecraftData(bot.version)
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
        let recipe = pickRecipe(bot, entry.id, null)
        let craftingTable = null

        if (!recipe) {
            craftingTable = await findOrPlaceCraftingTable(bot, mcData, options)
            recipe = pickRecipe(bot, entry.id, craftingTable)
        } else if (recipe.requiresTable) {
            craftingTable = await findOrPlaceCraftingTable(bot, mcData, options)
            if (!craftingTable) {
                throw new Error(`[Craft] ${normalized} needs a crafting table, but none is available`)
            }
            recipe = pickRecipe(bot, entry.id, craftingTable) || recipe
        }

        if (recipe) {
            const resultCount = recipe.result?.count || 1
            const craftsNeeded = Math.ceil(remainingNeeded / resultCount)

            console.log(`[Craft] Recipe for ${normalized}: ${recipeToString(recipe, mcData)}`)
            bot.chat(`Recipe: ${recipeToString(recipe, mcData)}`)

            const inputs = (recipe.delta || []).filter(r => r && typeof r.count === 'number' && r.count < 0)

            for (const input of inputs) {
                const neededAmount = Math.abs(input.count) * craftsNeeded
                const inputName = getMcEntryName(mcData, input.id)

                console.log(`[Craft] Need ${neededAmount} x ${inputName} for ${normalized}`)
                await craftItem(bot, inputName, neededAmount, options, stack)
            }

            if (recipe.requiresTable && !craftingTable) {
                craftingTable = await findOrPlaceCraftingTable(bot, mcData, options)
            }

            if (recipe.requiresTable && !craftingTable) {
                throw new Error(`[Craft] Recipe for ${normalized} requires a crafting table`)
            }

            console.log(`[Craft] Crafting ${craftsNeeded} x ${normalized}`)
            await bot.craft(recipe, craftsNeeded, craftingTable || null)
            return
        }

        const block = mcData.blocksByName[normalized]
        if (block) {
            console.log(`[Craft] No recipe for ${normalized}; gathering block instead`)
            await mineBlock(bot, mcData, {
                blockName: normalized,
                amount: remainingNeeded
            })
            return
        }

        throw new Error(`[Craft] No recipe or gather source for ${normalized}`)
    } finally {
        stack.delete(normalized)
    }
}

module.exports = craftItem