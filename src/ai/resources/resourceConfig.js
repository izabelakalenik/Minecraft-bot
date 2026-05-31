const RESOURCES_CONFIG = [
    // Tier 1: High XP value
    { name: 'emerald_ore', xpValue: 5, tools: ['iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },
    { name: 'diamond_ore', xpValue: 3, tools: ['iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },
    
    // Tier 2: Medium-High XP value
    { name: 'coal_ore', xpValue: 1.5, tools: ['wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },
    { name: 'iron_ore', xpValue: 1.5, tools: ['stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },
    { name: 'gold_ore', xpValue: 1, tools: ['iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },

    // Tier 3
    { name: 'copper_ore', xpValue: 0.7, tools: ['stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },
    { name: 'stone', xpValue: 0.3, tools: ['wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },
    { name: 'cobblestone', xpValue: 0.3, tools: ['wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'] },

    // Tier 4
    { name: 'dirt', xpValue: 0.1, tools: ['wooden_shovel', 'stone_shovel', 'iron_shovel', 'diamond_shovel', 'netherite_shovel'] },
    { name: 'grass_block', xpValue: 0.1, tools: ['wooden_shovel', 'stone_shovel', 'iron_shovel', 'diamond_shovel', 'netherite_shovel'] },
]

RESOURCES_CONFIG.sort((a, b) => b.xpValue - a.xpValue)


function getResourcesByXp() {
    return [...RESOURCES_CONFIG]
}

function getHighValueResources(threshold = 0.5) {
    return RESOURCES_CONFIG.filter(r => r.xpValue >= threshold)
}

function getResource(name) {
    return RESOURCES_CONFIG.find(r => r.name === name) || null
}

function isHighPriority(name) {
    const resource = getResource(name)
    return resource && resource.xpValue >= 1.0
}

module.exports = {
    RESOURCES_CONFIG,
    getResourcesByXp,
    getHighValueResources,
    getResource,
    isHighPriority
}
