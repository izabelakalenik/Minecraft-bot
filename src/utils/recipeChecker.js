
function hasTool(bot, toolName) {
    const item = bot.inventory.items().find(i => i.name === toolName)
    return item !== undefined
}

function getBestTool(bot, toolType = 'pickaxe') {
    const toolPriority = {
        pickaxe: ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'golden_pickaxe', 'wooden_pickaxe'],
        shovel: ['diamond_shovel', 'iron_shovel', 'stone_shovel', 'golden_shovel', 'wooden_shovel'],
        axe: ['diamond_axe', 'iron_axe', 'stone_axe', 'golden_axe', 'wooden_axe'],
    }

    const tools = toolPriority[toolType] || []

    for (const toolName of tools) {
        if (hasTool(bot, toolName)) {
            return toolName
        }
    }

    return null
}

function getRecipeResources(bot, itemName) {
    const mcData = bot.registry
    const item = mcData.itemsByName[itemName]

    if (!item) return null

    // Get recipes for this item
    const recipes = bot.recipesFor(item.id, null, 1, null)

    if (!recipes || recipes.length === 0) return null

    const recipe = recipes[0]
    const ingredients = []

    // Extract ingredients from recipe
    if (recipe.inShape) {
        for (const row of recipe.inShape) {
            for (const ingredient of row) {
                if (ingredient) {
                    const ingredientName = mcData.items[ingredient.id]?.name
                    if (ingredientName) {
                        const existing = ingredients.find(i => i.name === ingredientName)
                        if (existing) {
                            existing.count += 1
                        } else {
                            ingredients.push({ name: ingredientName, count: 1 })
                        }
                    }
                }
            }
        }
    }

    return ingredients.length > 0 ? ingredients : null
}

function canCraftItem(bot, itemName) {
    const resources = getRecipeResources(bot, itemName)

    if (!resources) {
        return { canCraft: false, missing: null, reason: 'No recipe found' }
    }

    const missing = []
    let canCraft = true

    for (const resource of resources) {
        const inventory = bot.inventory.items().filter(i => i.name === resource.name)
        const have = inventory.reduce((sum, i) => sum + i.count, 0)

        if (have < resource.count) {
            canCraft = false
            missing.push({ name: resource.name, needed: resource.count, have })
        }
    }

    return { canCraft, missing }
}

function getPickaxeRequirements() {
    return [
        { name: 'oak_planks', count: 3 },   // wooden pickaxe
        { name: 'stone', count: 3 },        // stone pickaxe
        { name: 'iron_ingot', count: 3 },   // iron pickaxe
    ]
}

function getCraftingTableRequirements() {
    return [
        { name: 'oak_planks', count: 4 }
    ]
}

function getBoatRequirements() {
    return [
        { name: 'oak_planks', count: 5 }
    ]
}

function getToolRequirements(bot, toolName) {
    const toolRequirements = {
        pickaxe: getPickaxeRequirements(),
        crafting_table: getCraftingTableRequirements(),
        boat: getBoatRequirements(),
    }

    const requirements = toolRequirements[toolName]
    if (!requirements) return null

    for (const req of requirements) {
        const have = bot.inventory.items().filter(i => i.name === req.name)
            .reduce((sum, i) => sum + i.count, 0)

        if (have >= req.count) {
            return [req]
        }
    }

    return requirements.length > 0 ? [requirements[0]] : null
}

module.exports = {
    hasTool,
    getBestTool,
    getRecipeResources,
    canCraftItem,
    getPickaxeRequirements,
    getCraftingTableRequirements,
    getBoatRequirements,
    getToolRequirements
}
