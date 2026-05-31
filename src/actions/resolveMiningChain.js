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
    for (let i = 0; i < chain.length; i++) {
        const step = chain[i]
        console.log(`\n[ResolveMiningChain] Executing: ${step.action} ${step.item}`)

        if (step.action === 'MINE') {
            await executeMine(bot, step.item)
        } else if (step.action === 'CRAFT') {
            await executeCraft(bot, step.item, step.reason)

            if (step.item === 'crafting_table') {
                console.log('[ResolveMiningChain] Crafting table created - placing it...')
                await placeAndUseCraftingTable(bot)
                console.log('[ResolveMiningChain] Crafting table placed - recipes unlocked')

                for (let j = i + 1; j < chain.length; j++) {
                    if (chain[j].action === 'CRAFT' && chain[j].reason.includes('needs crafting table')) {
                        console.log(`[ResolveMiningChain] Retrying ${chain[j].item} now that crafting table is available`)
                        await executeCraft(bot, chain[j].item, chain[j].reason)
                        chain.splice(j, 1)  // Remove from chain since it's been handled
                        j--  // Adjust loop index
                    }
                }
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
        await mineBlock(bot, {}, { blockName: oreName, amount: 1 })
        console.log(`[ResolveMiningChain] Mined ${oreName}`)
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

        // Wait a bit for placement
        await bot.waitForTicks(10)

        // Open the crafting table
        const tableBlock = bot.findBlock({
            matching: bot.registry.blocksByName['crafting_table']?.id,
            maxDistance: 5
        })

        if (tableBlock) {
            await bot.openBlock(tableBlock)
            console.log('[ResolveMiningChain] Opened crafting table')
        }
    } catch (err) {
        console.log(`[ResolveMiningChain] Error with crafting table: ${err.message}`)
        throw err
    }
}

module.exports = resolveMiningChain
