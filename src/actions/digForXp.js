const { getHighValueResources } = require('../ai/resources/resourceConfig')
const { getBestTool } = require('../utils/recipeChecker')
const moveTo = require('../movement/navigator')

async function digForXp(bot, decision = {}) {
    // Only mine tier 2+ resources (coal, iron, gold, copper and higher)
    const resourcesToMine = getHighValueResources(0.7)

    // Check if bot has a pickaxe
    const pickaxe = getBestTool(bot, 'pickaxe')
    if (!pickaxe) {
        console.log('[DigForXp] No pickaxe available, cannot mine ore')
        throw new Error('No pickaxe in inventory')
    }

    console.log(`[DigForXp] Starting XP farming with ${pickaxe} (found ${resourcesToMine.length} resource types)`)
    bot.chat(`Mining for XP with ${pickaxe}...`)

    const mcData = bot.registry
    let mined = 0
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
        let foundBlock = null
        let resourceName = null

        // Try to find highest-value resource available
        for (const resource of resourcesToMine) {
            const blockId = mcData.blocksByName[resource.name]?.id

            if (!blockId) {
                console.log(`[DigForXp] Unknown block: ${resource.name}`)
                continue
            }

            const block = bot.findBlock({
                matching: blockId,
                maxDistance: 256,
                count: 1
            })

            if (block) {
                foundBlock = block
                resourceName = resource.name
                console.log(`[DigForXp] Found ${resourceName} (XP: ${resource.xpValue})`)
                break
            }
        }

        if (!foundBlock) {
            console.log(`[DigForXp] No tier 2+ resources found nearby, wandering...`)

            // Wander to find resources
            const x = bot.entity.position.x + (Math.random() * 30 - 15)
            const y = bot.entity.position.y
            const z = bot.entity.position.z + (Math.random() * 30 - 15)

            try {
                await moveTo(bot, { x, y, z }, 15000, 2)
            } catch (err) {
                console.log(`[DigForXp] Wander failed: ${err.message}`)
            }
            attempts++
            continue
        }

        try {
            const target = foundBlock.position.offset(1, 0, 0)
            console.log(`[DigForXp] Mining ${resourceName} at ${foundBlock.position.x}, ${foundBlock.position.y}, ${foundBlock.position.z}`)

            await moveTo(bot, target, 20000, 2)

            await bot.lookAt(foundBlock.position.offset(0.5, 0.5, 0.5))

            if (bot.canDigBlock(foundBlock)) {
                await bot.dig(foundBlock)
                mined++
                console.log(`[DigForXp] Mined ${resourceName} (${mined} total)`)
            } else {
                console.log(`[DigForXp] Cannot dig block - maybe need better tool`)
            }

            await bot.waitForTicks(10)
        } catch (err) {
            console.log(`[DigForXp] Error: ${err.message}`)
        }

        attempts++
    }

    console.log(`[DigForXp] Finished (${mined} mined, ${attempts} attempts)`)
}

module.exports = digForXp
