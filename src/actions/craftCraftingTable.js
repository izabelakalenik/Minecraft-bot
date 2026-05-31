const placeItem = require('./placeItem')

async function craftCraftingTable(bot, decision = {}) {
    console.log('[CraftCraftingTable] Attempting to craft and place crafting table')
    bot.chat('Crafting crafting table...')

    try {
        // Check if bot already has a crafting table
        const tableItem = bot.inventory.items().find(i => i.name === 'crafting_table')
        if (tableItem) {
            console.log(`[CraftCraftingTable] Already have crafting table, placing it`)

            const pos = bot.entity.position.floored()
            const placePos = pos.offset(1, 0, 0)

            await placeItem(bot, {
                name: 'crafting_table',
                amount: 1
            })

            console.log('[CraftCraftingTable] Crafting table placed')
            return
        }

        // Need to craft one - requires 4 planks
        const woodTypes = ['oak_planks', 'birch_planks', 'spruce_planks', 'jungle_planks', 'dark_oak_planks', 'acacia_planks']
        const planksCount = bot.inventory.items()
            .filter(i => woodTypes.includes(i.name))
            .reduce((sum, i) => sum + i.count, 0)

        if (planksCount < 4) {
            console.log(`[CraftCraftingTable] Not enough planks (have ${planksCount}, need 4)`)
            throw new Error('Insufficient planks to craft crafting table')
        }

        // Craft the table
        const mcData = bot.registry
        const tableId = mcData.itemsByName['crafting_table']?.id

        if (!tableId) {
            throw new Error('Crafting table item not found in registry')
        }

        const recipes = bot.recipesFor(tableId, null, 1, null)
        if (!recipes || recipes.length === 0) {
            throw new Error('No recipe for crafting table')
        }

        await bot.craft(recipes[0], 1, null)
        console.log('[CraftCraftingTable] Crafting table crafted')

        // Place it
        const pos = bot.entity.position.floored()
        const placePos = pos.offset(1, 0, 0)

        const placeBlock = bot.blockAt(placePos)
        if (placeBlock && placeBlock.name !== 'air') {
            console.log('[CraftCraftingTable] Target placement area is occupied, trying another spot')
            const altPlacePos = pos.offset(0, -1, 1)

            await placeItem(bot, {
                name: 'crafting_table',
                amount: 1
            })
        } else {
            await placeItem(bot, {
                name: 'crafting_table',
                amount: 1
            })
        }

        console.log('[CraftCraftingTable] Crafting table placed successfully')
    } catch (err) {
        console.log(`[CraftCraftingTable] Error: ${err.message}`)
        throw err
    }
}

module.exports = craftCraftingTable
