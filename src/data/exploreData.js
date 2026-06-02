const ORE_TARGETS = [
    // {
    //     name: 'diamond_ore',
    //     blocks: ['diamond_ore', 'deepslate_diamond_ore'],
    //     requiredTool: 'iron_pickaxe',
    //     xpPriority: 100,
    // },
    // {
    //     name: 'emerald_ore',
    //     blocks: ['emerald_ore', 'deepslate_emerald_ore'],
    //     requiredTool: 'iron_pickaxe',
    //     xpPriority: 90,
    // },
    // {
    //     name: 'ancient_debris',
    //     blocks: ['ancient_debris'],
    //     requiredTool: 'diamond_pickaxe',
    //     xpPriority: 85,
    // },
    // {
    //     name: 'redstone_ore',
    //     blocks: ['redstone_ore', 'deepslate_redstone_ore'],
    //     requiredTool: 'iron_pickaxe',
    //     xpPriority: 80,
    // },
    // {
    //     name: 'lapis_ore',
    //     blocks: ['lapis_ore', 'deepslate_lapis_ore'],
    //     requiredTool: 'stone_pickaxe',
    //     xpPriority: 70,
    // },
    {
        name: 'gold_ore',
        blocks: ['gold_ore', 'deepslate_gold_ore', 'nether_gold_ore'],
        requiredTool: 'stone_pickaxe',
        xpPriority: 60,
    },
    {
        name: 'iron_ore',
        blocks: ['iron_ore', 'deepslate_iron_ore'],
        requiredTool: 'stone_pickaxe',
        xpPriority: 50,
    },
    {
        name: 'coal_ore',
        blocks: ['coal_ore', 'deepslate_coal_ore'],
        requiredTool: 'wooden_pickaxe',
        xpPriority: 40,
    },
]

const RESOURCE_DEFS = {
    logs: {
        blocks: [
            'oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log',
            'dark_oak_log', 'mangrove_log', 'cherry_log',
            'crimson_stem', 'warped_stem',
            'oak_wood', 'spruce_wood', 'birch_wood', 'jungle_wood', 'acacia_wood',
            'dark_oak_wood', 'mangrove_wood', 'cherry_wood',
            'crimson_hyphae', 'warped_hyphae',
        ],
        preferredTool: null,
    },
    cobblestone: {
        blocks: ['stone', 'deepslate'],
        preferredTool: 'wooden_pickaxe',
    },
}

module.exports = {
    ORE_TARGETS,
    RESOURCE_DEFS,
}