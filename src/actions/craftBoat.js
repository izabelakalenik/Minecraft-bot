const mineBlock = require('./mineBlock')

async function craftBoat(bot, decision = {}) {
    console.log(`[CraftBoat] Attempting to craft a boat`)
    bot.chat('Crafting boat...')

    try {
        // Check if bot already has a boat
        const boatItem = bot.inventory.items().find(i => i.name === 'boat')
        if (boatItem) {
            console.log(`[CraftBoat] Already have ${boatItem.count} boat(s)`)
            return
        }

        // Find wood planks in inventory
        const woodTypes = ['oak_planks', 'birch_planks', 'spruce_planks', 'jungle_planks', 'dark_oak_planks', 'acacia_planks']
        const planksItem = bot.inventory.items().find(i => woodTypes.includes(i.name))

        let planksCount = planksItem?.count || 0

        // If not enough planks, try to get wood
        if (planksCount < 5) {
            console.log(`[CraftBoat] Only have ${planksCount} planks, need 5. Mining logs...`)

            // Try to mine wood first
            try {
                await mineBlock(bot, {}, { blockName: 'oak_log', amount: 1 })
            } catch (err) {
                console.log(`[CraftBoat] Could not get enough planks`)
                throw new Error('Insufficient wood planks to craft boat')
            }

            // Check again
            planksCount = bot.inventory.items()
                .filter(i => woodTypes.includes(i.name))
                .reduce((sum, i) => sum + i.count, 0)
        }

        if (planksCount < 5) {
            console.log(`[CraftBoat] Still not enough planks (have ${planksCount}, need 5)`)
            throw new Error('Insufficient wood planks to craft boat')
        }

        // Craft the boat
        const mcData = bot.registry
        const boatId = mcData.itemsByName['boat']?.id

        if (!boatId) {
            throw new Error('Boat item not found in registry')
        }

        const recipes = bot.recipesFor(boatId, null, 1, null)
        if (!recipes || recipes.length === 0) {
            throw new Error('No recipe for boat')
        }

        await bot.craft(recipes[0], 1, null)
        console.log(`[CraftBoat] Boat crafted successfully`)
    } catch (err) {
        console.log(`[CraftBoat] Error: ${err.message}`)
        throw err
    }
}

module.exports = craftBoat
