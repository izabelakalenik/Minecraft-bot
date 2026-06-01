const minecraftData = require('minecraft-data')
const moveTo = require('../movement/navigator')
const placeItem = require('./placeItem')

function countByName(bot, itemName) {
    return (bot?.inventory?.items?.() || [])
        .filter(item => item.name === itemName)
        .reduce((sum, item) => sum + item.count, 0)
}

function findBlockByName(bot, blockName, maxDistance = 300) {
    return bot.findBlock({
        matching: block => block && block.name === blockName,
        maxDistance,
    })
}

function findCraftingTableBlock(bot) {
    return bot.findBlock({
        matching: block => block && block.name === 'crafting_table',
        maxDistance: 4,
    })
}

function findFurnaceBlock(bot) {
    return bot.findBlock({
        matching: block => block && block.name === 'furnace',
        maxDistance: 4,
    })
}

function findFuelItem(bot) {
    const fuelPriority = [
        'coal',
        'charcoal',
        'oak_planks',
        'spruce_planks',
        'birch_planks',
        'jungle_planks',
        'acacia_planks',
        'dark_oak_planks',
        'mangrove_planks',
        'cherry_planks',
        'crimson_planks',
        'warped_planks',
        'stick',
        'oak_log',
        'spruce_log',
        'birch_log',
        'jungle_log',
        'acacia_log',
        'dark_oak_log',
        'mangrove_log',
        'cherry_log',
    ]

    for (const name of fuelPriority) {
        const item = bot.inventory.items().find(i => i.name === name)
        if (item) return item
    }

    return null
}

async function wander(bot) {
    const x = bot.entity.position.x + (Math.random() * 12 - 6)
    const y = bot.entity.position.y
    const z = bot.entity.position.z + (Math.random() * 12 - 6)

    try {
        await moveTo(bot, { x, y, z }, 12000, 2)
    } catch (err) {
        console.log(`[Explore] Wander failed: ${err.message}`)
    }
}

async function craftItem(bot, decision) {
    console.log(`[Explore] Craft requested: ${decision.itemName}`)
    const mcData = minecraftData(bot.version)
    const itemDef = mcData.itemsByName[decision.itemName]

    if (!itemDef) {
        throw new Error(`[Explore] Unknown item: ${decision.itemName}`)
    }

    const craftingTable = decision.requiresTable ? findCraftingTableBlock(bot) : null
    const recipes = bot.recipesFor(
        itemDef.id,
        null,
        decision.amount || 1,
        craftingTable
    )

    if (!recipes || recipes.length === 0) {
        throw new Error(`[Explore] No craftable recipe found for ${decision.itemName}`)
    }

    await bot.craft(recipes[0], decision.amount || 1, craftingTable)
}

async function smeltItem(bot, decision) {
    const mcData = minecraftData(bot.version)
    const inputDef = mcData.itemsByName[decision.inputItemName]
    const outputDef = mcData.itemsByName[decision.outputItemName]

    if (!inputDef) {
        throw new Error(`[Explore] Unknown input item: ${decision.inputItemName}`)
    }
    if (!outputDef) {
        throw new Error(`[Explore] Unknown output item: ${decision.outputItemName}`)
    }

    let furnaceBlock = findFurnaceBlock(bot)

    if (!furnaceBlock) {
        const furnaceItem = bot.inventory.items().find(item => item.name === 'furnace')
        if (!furnaceItem) {
            throw new Error('[Explore] No furnace in inventory')
        }

        await placeItem(bot, { name: 'furnace' })

        furnaceBlock = findFurnaceBlock(bot)
    }

    if (!furnaceBlock) {
        throw new Error('[Explore] Furnace not found after placing')
    }

    const furnace = await bot.openFurnace(furnaceBlock)

    const amount = decision.amount || 1
    let smelted = 0
    let attempts = 0

    while (smelted < amount && attempts < 20) {
        const inputItem = bot.inventory.items().find(item => item.name === decision.inputItemName)
        if (!inputItem) {
            throw new Error(`[Explore] Missing input item ${decision.inputItemName}`)
        }

        const fuelItem = findFuelItem(bot)
        if (!fuelItem) {
            throw new Error('[Explore] No fuel available')
        }

        await furnace.putInput(inputItem.type, inputItem.metadata || 0, 1)
        await furnace.putFuel(fuelItem.type, fuelItem.metadata || 0, 1)

        let waited = 0
        while (waited < 60) {
            const out = furnace.outputItem()
            if (out && out.name === decision.outputItemName) {
                break
            }
            await bot.waitForTicks(10)
            waited++
        }

        const output = furnace.outputItem()
        if (output && output.name === decision.outputItemName) {
            await furnace.takeOutput()
            smelted++
        }

        attempts++
    }

    if (smelted < amount) {
        throw new Error(`[Explore] Failed to smelt ${decision.outputItemName}`)
    }
}

async function mineBlockByName(bot, blockName) {
    const block = findBlockByName(bot, blockName, 300)
    if (!block) {
        return false
    }

    const targetPos = block.position.offset(1, 0, 0)
    await moveTo(bot, targetPos, 20000, 2)
    await bot.lookAt(block.position.offset(0.5, 0.5, 0.5))

    if (bot.canDigBlock(block)) {
        await bot.dig(block)
        return true
    }

    return false
}

async function explore(bot, decision) {
    switch (decision.type) {
        case 'EXPLORE_IDLE':
            return

        case 'EXPLORE_SEARCH':
            await wander(bot)
            return

        case 'EXPLORE_PLACE_CRAFTING_TABLE':
            await placeItem(bot, { name: 'crafting_table' })
            return

        case 'EXPLORE_PLACE_FURNACE':
            await placeItem(bot, { name: 'furnace' })
            return

        case 'EXPLORE_CRAFT':
            await craftItem(bot, decision)
            return

        case 'EXPLORE_SMELT':
            await smeltItem(bot, decision)
            return

        case 'EXPLORE_MINE': {
            const amountNeeded = decision.amount || 1
            const targetItemName = decision.targetItemName || decision.blockName
            let attempts = 0
            const maxAttempts = 40

            while (attempts < maxAttempts) {
                if (countByName(bot, targetItemName) >= amountNeeded) {
                    return
                }

                const blockFound = findBlockByName(bot, decision.blockName, 300)
                if (!blockFound) {
                    await wander(bot)
                    attempts++
                    continue
                }

                try {
                    await mineBlockByName(bot, decision.blockName)
                    await bot.waitForTicks(8)
                } catch (err) {
                    console.log(`[Explore] Mine error: ${err.message}`)
                }

                attempts++
            }

            return
        }

        case 'EXPLORE_STUCK':
            console.log(`[Explore] Stuck: ${decision.reason || 'unknown reason'}`)
            return

        default:
            console.log(`[Explore] Unknown explore decision: ${decision.type}`)
            return
    }
}

module.exports = explore