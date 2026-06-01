const { getHighValueResources } = require('../ai/resources/resourceConfig')
const { getOreMinimumTier, canMineTier, getCurrentPickaxeTier, TIER_TO_PICKAXE } = require('./oreTierRequirements')

/**
 * Crafting chain resolver
 * Recursively resolves dependencies: ore → pickaxe → ore → pickaxe → ...
 */
class CraftingChainResolver {
    constructor(bot) {
        this.bot = bot
        this.visited = new Set()  // Prevent infinite loops
        this.chain = []           // List of {action, item, reason}
        this.itemsNeedingCraftingTable = new Set()  // Items that need crafting table to resolve
        this.craftingTablePlaced = false  // Track if crafting table is in chain
    }

    /**
     * Build a crafting chain to get a target item
     * @param {string} targetItem - Item name we want (e.g., 'diamond_ore', 'wooden_pickaxe')
     * @returns {Array} Chain of actions to take
     */
    async resolveChain(targetItem) {
        this.chain = []
        this.visited.clear()
        this.itemsNeedingCraftingTable.clear()
        this.craftingTablePlaced = false
        
        try {
            // First pass: check if we need crafting table by doing a dry run
            console.log('[CraftingChain] Checking if crafting table is needed...')
            const needsCraftingTable = await this.checkNeedsCraftingTable(targetItem)
            
            // If crafting table is needed, resolve it first
            if (needsCraftingTable) {
                console.log('[CraftingChain] Crafting table needed - resolving it first')
                // Start fresh with crafting table
                this.chain = []
                this.visited.clear()
                await this.resolve('crafting_table')
                this.craftingTablePlaced = true
                console.log(`[CraftingChain] Crafting table chain resolved (${this.chain.length} steps)`)
            }
            
            // Now resolve the target item with crafting table available
            // DON'T clear the chain - append to it!
            this.visited.clear()
            this.itemsNeedingCraftingTable.clear()
            await this.resolve(targetItem)
            
            console.log(`[CraftingChain] Final chain: ${this.chain.length} steps`)
            return this.chain
        } catch (err) {
            console.log(`[CraftingChain] Error: ${err.message}`)
            return null
        }
    }

    /**
     * Check if an item needs crafting table (dry run)
     * @private
     */
    async checkNeedsCraftingTable(itemName, visited = new Set()) {
        if (visited.has(itemName)) return false
        visited.add(itemName)

        if (this.isOre(itemName)) {
            // Check if we need a pickaxe upgrade
            const tierNeeded = getOreMinimumTier(itemName)
            const currentTier = getCurrentPickaxeTier(this.bot)
            
            if (!canMineTier(currentTier, tierNeeded)) {
                // Need pickaxe - check if pickaxe needs crafting table
                const nextTier = this.getNextTier(currentTier, tierNeeded)
                const nextPickaxeName = TIER_TO_PICKAXE[nextTier]
                return await this.checkNeedsCraftingTable(nextPickaxeName, visited)
            }
            return false
        }

        // Check if recipe is available
        const mcData = this.bot.registry
        const item = mcData.itemsByName[itemName]
        if (!item) return false

        console.log("all recipes", this.bot.recipesAll().map(r => mcData.items[r.result.id]?.name).filter(n => n))

        const recipes = this.bot.recipesFor(item.id, null, 1, null)
        if (recipes && recipes.length > 0) return false

        // No recipe available - needs crafting table
        return true
    }

    /**
     * Recursively resolve an item
     * @private
     */
    async resolve(itemName, depth = 0) {
        const indent = '  '.repeat(depth)
        console.log(`${indent}[CraftingChain] Resolving ${itemName}`)

        // Prevent infinite loops
        if (this.visited.has(itemName)) {
            console.log(`${indent}[CraftingChain] Already visited ${itemName}`)
            return
        }
        this.visited.add(itemName)

        // Check if we already have it
        const inventory = this.bot.inventory.items()
        const hasItem = inventory.find(i => i.name === itemName)
        
        if (hasItem && hasItem.count > 0) {
            console.log(`${indent}[CraftingChain] Already have ${itemName} (${hasItem.count}x)`)
            return
        }

        // Check if this is an ore - needs mining
        if (this.isOre(itemName)) {
            await this.resolveOre(itemName, depth)
            return
        }

        // Special case: planks - can be crafted from logs without crafting table
        if (itemName.includes('planks')) {
            const logType = itemName.replace('_planks', '_log')
            console.log(`${indent}[CraftingChain] Need planks - can craft from ${logType}`)
            
            // Resolve the corresponding logs
            await this.resolve(logType, depth + 1)
            
            // Add plank crafting (inventory craft)
            this.chain.push({
                action: 'CRAFT',
                item: itemName,
                reason: `Craft ${itemName} from ${logType}`
            })
            return
        }

        // Special case: sticks - can be crafted from planks without crafting table
        if (itemName === 'stick') {
            console.log(`${indent}[CraftingChain] Need sticks - can craft from planks`)
            
            // Resolve planks first
            await this.resolve('oak_planks', depth + 1)
            
            // Add stick crafting (inventory craft)
            this.chain.push({
                action: 'CRAFT',
                item: 'stick',
                reason: 'Craft sticks from planks'
            })
            return
        }

        // Special case: crafting_table - needs planks
        if (itemName === 'crafting_table') {
            console.log(`${indent}[CraftingChain] Need crafting table - requires 4 planks`)
            
            // Resolve planks first (this will resolve logs → planks automatically)
            await this.resolve('oak_planks', depth + 1)
            
            // Add crafting table to chain
            this.chain.push({
                action: 'CRAFT',
                item: 'crafting_table',
                reason: 'Craft crafting table for complex recipes'
            })
            return
        }

        // Otherwise it's a craftable item - get recipe
        const recipe = await this.getRecipe(itemName, depth)
        
        if (!recipe) {
            // Recipe not available - needs crafting table
            // Just mark that we need to craft this item
            console.log(`${indent}[CraftingChain] Will craft ${itemName} after crafting table is placed`)
            this.chain.push({
                action: 'CRAFT',
                item: itemName,
                reason: `Craft ${itemName} (needs crafting table)`
            })
            return
        }

        console.log(`${indent}[CraftingChain] Recipe for ${itemName}: needs ${JSON.stringify(recipe.ingredients)}`)

        // Recursively resolve all ingredients
        for (const ingredient of recipe.ingredients) {
            await this.resolve(ingredient.name, depth + 1)
        }

        // After resolving all ingredients, add crafting action
        this.chain.push({
            action: 'CRAFT',
            item: itemName,
            reason: `Craft ${itemName}`
        })
    }

    /**
     * Resolve mining an ore (includes pickaxe resolution)
     * @private
     */
    async resolveOre(oreName, depth = 0) {
        const indent = '  '.repeat(depth)
        
        // Determine pickaxe tier needed
        const tierNeeded = getOreMinimumTier(oreName)
        const currentTier = getCurrentPickaxeTier(this.bot)

        console.log(`${indent}[CraftingChain] Ore ${oreName} needs ${tierNeeded} tier pickaxe (have: ${currentTier})`)

        // Check if current pickaxe can mine this ore
        if (!canMineTier(currentTier, tierNeeded)) {
            // Need to get better pickaxe
            const nextTier = this.getNextTier(currentTier, tierNeeded)
            const nextPickaxeName = TIER_TO_PICKAXE[nextTier]
            
            console.log(`${indent}[CraftingChain] Need upgrade to ${nextPickaxeName}`)
            
            // Recursively resolve the pickaxe
            await this.resolve(nextPickaxeName, depth + 1)
        }

        // After pickaxe is resolved, add mining action
        this.chain.push({
            action: 'MINE',
            item: oreName,
            reason: `Mine ${oreName} for crafting chain`
        })
    }

    /**
     * Get the next pickaxe tier we should craft
     * @private
     */
    getNextTier(currentTier, targetTier) {
        const tiers = ['wooden', 'stone', 'iron', 'diamond']
        const currentIdx = tiers.indexOf(currentTier === 'hand' ? 'wooden' : currentTier)
        const targetIdx = tiers.indexOf(targetTier)

        // Return the tier just below target, or next tier up from current
        if (targetIdx > currentIdx) {
            return tiers[currentIdx + 1]
        }
        return tiers[Math.min(currentIdx + 1, tiers.length - 1)]
    }

    /**
     * Check if item is an ore or minable resource
     * @private
     */
    isOre(itemName) {
        const oreList = [
            'stone', 'cobblestone', 'dirt', 'grass_block', 'gravel',
            'coal_ore', 'iron_ore', 'gold_ore', 'copper_ore', 'diamond_ore', 'emerald_ore', 'lapis_ore', 'obsidian',
            'oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'
        ]
        return itemName.includes('ore') || oreList.includes(itemName)
    }

    /**
     * Get recipe for an item from inventory or crafting table
     * @private
     */
    async getRecipe(itemName, depth = 0) {
        const indent = '  '.repeat(depth)
        const mcData = this.bot.registry
        const item = mcData.itemsByName[itemName]

        if (!item) {
            console.log(`${indent}[CraftingChain] Item ${itemName} not in registry`)
            return null
        }

        // Try to get recipe from current crafting area
        const recipes = this.bot.recipesFor(item.id, null, 1, null)

        if (recipes && recipes.length > 0) {
            const recipe = recipes[0]
            const ingredients = this.extractIngredients(recipe)
            
            console.log(`${indent}[CraftingChain] Found recipe for ${itemName} in inventory`)
            return { name: itemName, ingredients }
        }

        // Recipe not available in inventory - mark that we need crafting table
        console.log(`${indent}[CraftingChain] No recipe for ${itemName} available in inventory`)
        console.log(`${indent}[CraftingChain] This item needs crafting table - will resolve after table is placed`)
        
        // Mark this item as needing crafting table
        this.itemsNeedingCraftingTable.add(itemName)
        
        // Return null - caller will handle this
        return null
    }

    /**
     * Extract ingredient list from recipe
     * @private
     */
    extractIngredients(recipe) {
        const mcData = this.bot.registry
        const ingredients = []
        const seen = {}

        if (recipe.inShape) {
            for (const row of recipe.inShape) {
                for (const ingredient of row) {
                    if (ingredient) {
                        const ingredientName = mcData.items[ingredient.id]?.name
                        if (ingredientName) {
                            if (!seen[ingredientName]) {
                                seen[ingredientName] = 0
                            }
                            seen[ingredientName] += 1
                        }
                    }
                }
            }
        }

        for (const [name, count] of Object.entries(seen)) {
            ingredients.push({ name, count })
        }

        return ingredients
    }
}

/**
 * Simple helper to check if we can craft an item right now
 */
async function canCraftItemNow(bot, itemName) {
    const mcData = bot.registry
    const item = mcData.itemsByName[itemName]

    if (!item) return false

    const recipes = bot.recipesFor(item.id, null, 1, null)
    return recipes && recipes.length > 0
}

module.exports = {
    CraftingChainResolver,
    canCraftItemNow
}
