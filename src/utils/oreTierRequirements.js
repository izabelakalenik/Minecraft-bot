
const ORE_TIERS = {
    'stone': 'hand',
    'cobblestone': 'hand',
    'dirt': 'hand',
    'grass_block': 'hand',
    'gravel': 'hand',
    'coal_ore': 'wooden',
    'copper_ore': 'wooden',
    'lapis_ore': 'stone',
    'iron_ore': 'stone',
    'gold_ore': 'iron',
    'diamond_ore': 'iron',
    'emerald_ore': 'iron',
    'obsidian': 'diamond',
}

const PICKAXE_TIERS = ['wooden', 'stone', 'iron', 'diamond']
const TIER_TO_PICKAXE = {
    'wooden': 'wooden_pickaxe',
    'stone': 'stone_pickaxe',
    'iron': 'iron_pickaxe',
    'diamond': 'diamond_pickaxe',
}

const PICKAXE_TO_TIER = {
    'wooden_pickaxe': 'wooden',
    'stone_pickaxe': 'stone',
    'iron_pickaxe': 'iron',
    'diamond_pickaxe': 'diamond',
}


function getOreMinimumTier(oreName) {
    return ORE_TIERS[oreName] || 'hand'
}

function canMineTier(currentTier, targetTier) {
    if (targetTier === 'hand') return true
    const currentIdx = PICKAXE_TIERS.indexOf(currentTier)
    const targetIdx = PICKAXE_TIERS.indexOf(targetTier)
    return currentIdx >= targetIdx
}

function getCurrentPickaxeTier(bot) {
    for (const [pickaxeName, tier] of Object.entries(PICKAXE_TO_TIER)) {
        if (bot.inventory.items().find(i => i.name === pickaxeName)) {
            return tier
        }
    }
    return 'hand'
}

module.exports = {
    ORE_TIERS,
    PICKAXE_TIERS,
    TIER_TO_PICKAXE,
    PICKAXE_TO_TIER,
    getOreMinimumTier,
    canMineTier,
    getCurrentPickaxeTier
}
