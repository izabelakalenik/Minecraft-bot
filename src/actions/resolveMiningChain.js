const { CraftingChainResolver } = require('../utils/craftingChainResolver')
const { getHighValueResources } = require('../ai/resources/resourceConfig')
const { getCurrentPickaxeTier, getOreMinimumTier, canMineTier } = require('../utils/oreTierRequirements')
const mineBlock = require('./mineBlock')

async function resolveMiningChain(bot, decision = {}) {
    console.log('[ResolveMiningChain] Starting chain resolution for XP farming')
    bot.chat('Analyzing mining requirements...')

    try {
        // Get list of ores we want to mine (Tier 2+)
        const targetOres = getHighValueResources(0.7)
            .filter(r => r.name.includes('ore'))

        if (targetOres.length === 0) {
            console.log('[ResolveMiningChain] No minable ores available')
            throw new Error('No suitable ores to mine')
        }

        // Try each ore, starting with highest XP value
        for (const ore of targetOres) {
            console.log(`\n[ResolveMiningChain] Analyzing ore: ${ore.name} (XP: ${ore.xpValue})`)

            try {
                // Create resolver to build chain
                const resolver = new CraftingChainResolver(bot)
                const chain = await resolver.resolveChain(ore.name)

                if (!chain || chain.length === 0) {
                    console.log(`[ResolveMiningChain] Could not resolve chain for ${ore.name}`)
                    continue
                }

                console.log(`\n[ResolveMiningChain] ===== MINING CHAIN FOR ${ore.name.toUpperCase()} =====`)
                for (let i = 0; i < chain.length; i++) {
                    console.log(`  ${i + 1}. ${chain[i].action}: ${chain[i].item} (${chain[i].reason})`)
                }
                console.log(`================================================\n`)

                // Execute chain step by step
                await executeChain(bot, chain)
                console.log(`[ResolveMiningChain] Successfully completed chain for ${ore.name}`)
                return
            } catch (err) {
                console.log(`[ResolveMiningChain] Failed to resolve ${ore.name}: ${err.message}`)
                continue
            }
        }

        throw new Error('Could not resolve any mining chains')
    } catch (err) {
        console.log(`[ResolveMiningChain] Error: ${err.message}`)
        throw err
    }
}

async function executeChain(bot, chain) {
    let craftingTableOpen = false
    
    for (let i = 0; i < chain.length; i++) {
        const step = chain[i]
        console.log(`\n[ResolveMiningChain] Executing: ${step.action} ${step.item}`)

        if (step.action === 'MINE') {
            await executeMine(bot, step.item)
        } else if (step.action === 'CRAFT') {
            // If we're about to craft something that needs crafting table, ensure it's open
            if (step.reason && step.reason.includes('needs crafting table') && !craftingTableOpen) {
                // Find and open crafting table
                console.log('[ResolveMiningChain] Item needs crafting table - placing it...')
                await placeAndUseCraftingTable(bot)
                craftingTableOpen = true
                console.log('[ResolveMiningChain] Crafting table is now open')
            }
            
            await executeCraft(bot, step.item, step.reason)

            // If we just crafted the crafting table itself, mark it as open
            if (step.item === 'crafting_table') {
                console.log('[ResolveMiningChain] Crafting table created - placing it...')
                await placeAndUseCraftingTable(bot)
                craftingTableOpen = true
                console.log('[ResolveMiningChain] Crafting table placed and opened')
            }
        }

        await bot.waitForTicks(10)
    }
}


async function executeMine(bot, oreName) {
    console.log(`[ResolveMiningChain] Mining ${oreName}...`)

    // Check current pickaxe tier
    const currentTier = getCurrentPickaxeTier(bot)
    const neededTier = getOreMinimumTier(oreName)

    if (!canMineTier(currentTier, neededTier)) {
        throw new Error(`Cannot mine ${oreName} with ${currentTier} pickaxe (need ${neededTier})`)
    }

    try {
        // Use bot.registry directly instead of passing mcData
        const blockId = bot.registry.blocksByName[oreName]?.id

        if (!blockId) {
            throw new Error(`Unknown block: ${oreName}`)
        }

        // Find and mine the block
        const block = bot.findBlock({
            matching: blockId,
            maxDistance: 300
        })

        if (!block) {
            throw new Error(`Block ${oreName} not found nearby`)
        }

        const moveTo = require('../movement/navigator')
        const target = block.position.offset(1, 0, 0)
        
        await moveTo(bot, target, 20000, 2)
        await bot.lookAt(block.position.offset(0.5, 0.5, 0.5))

        if (bot.canDigBlock(block)) {
            await bot.dig(block)
            console.log(`[ResolveMiningChain] Mined ${oreName}`)
        } else {
            throw new Error(`Cannot dig ${oreName} - maybe need better tool`)
        }
    } catch (err) {
        console.log(`[ResolveMiningChain] Failed to mine ${oreName}: ${err.message}`)
        throw err
    }
}

async function executeCraft(bot, itemName, reason = '') {
    console.log(`[ResolveMiningChain] Crafting ${itemName}...`)

    const mcData = bot.registry
    const item = mcData.itemsByName[itemName]

    if (!item) {
        throw new Error(`Item ${itemName} not in registry`)
    }

    // Special handling for planks (logs → planks)
    if (itemName.includes('planks')) {
        const logType = itemName.replace('_planks', '_log')
        const logItem = mcData.itemsByName[logType]
        
        if (logItem) {
            const recipes = bot.recipesFor(logItem.id, null, 1, null)
            if (recipes && recipes.length > 0) {
                // Use log recipe to craft planks
                await bot.craft(recipes[0], 1, null)
                console.log(`[ResolveMiningChain] Crafted ${itemName} from ${logType}`)
                return
            }
        }
    }

    // Special handling for sticks (planks → sticks)
    if (itemName === 'stick') {
        const plankItem = mcData.itemsByName['oak_planks']
        if (plankItem) {
            const recipes = bot.recipesFor(plankItem.id, null, 1, null)
            if (recipes && recipes.length > 0) {
                // Use planks recipe to craft sticks
                await bot.craft(recipes[0], 1, null)
                console.log(`[ResolveMiningChain] Crafted ${itemName} from planks`)
                return
            }
        }
    }

    // Try to get recipe
    const recipes = bot.recipesFor(item.id, null, 1, null)

    if (!recipes || recipes.length === 0) {
        console.log(`[ResolveMiningChain] No recipe for ${itemName}, trying crafting table...`)

        // Need to create crafting table
        const tableItem = bot.inventory.items().find(i => i.name === 'crafting_table')
        if (tableItem) {
            console.log(`[ResolveMiningChain] Opening crafting table...`)
            await placeAndUseCraftingTable(bot)

            // Try again
            const recipesFromTable = bot.recipesFor(item.id, null, 1, null)
            if (recipesFromTable && recipesFromTable.length > 0) {
                await bot.craft(recipesFromTable[0], 1, null)
                console.log(`[ResolveMiningChain] Crafted ${itemName} from table`)
                return
            }
        }

        throw new Error(`Cannot craft ${itemName} - no recipe available`)
    }

    await bot.craft(recipes[0], 1, null)
    console.log(`[ResolveMiningChain] Crafted ${itemName}`)
}

async function placeAndUseCraftingTable(bot) {
    const placeItem = require('./placeItem')

    try {
        // Place crafting table
        await placeItem(bot, { name: 'crafting_table', amount: 1 })
        console.log('[ResolveMiningChain] Placed crafting table')

        // Wait for block to be placed
        await bot.waitForTicks(20)

        // Open the crafting table
        const tableBlock = bot.findBlock({
            matching: bot.registry.blocksByName['crafting_table']?.id,
            maxDistance: 5
        })

        if (!tableBlock) {
            throw new Error('Could not find placed crafting table')
        }

        await bot.openBlock(tableBlock)
        console.log('[ResolveMiningChain] Opened crafting table - recipes now available')
        
        // Wait a bit more to ensure recipes are loaded
        await bot.waitForTicks(10)
        
        // Verify recipes are available
        const mcData = bot.registry
        const stonePickaxe = mcData.itemsByName['stone_pickaxe']
        if (stonePickaxe) {
            const recipes = bot.recipesFor(stonePickaxe.id, null, 1, null)
            console.log(`[ResolveMiningChain] Available recipes for stone_pickaxe: ${recipes ? recipes.length : 0}`)
        }
    } catch (err) {
        console.log(`[ResolveMiningChain] Error with crafting table: ${err.message}`)
        throw err
    }
}

module.exports = resolveMiningChain
