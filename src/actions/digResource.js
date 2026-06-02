// actions/digResource.js
const minecraftData = require('minecraft-data')
const moveTo = require('../movement/navigator')

function normalizeName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/^minecraft:/, '')
}

function getBestPickaxe(bot, mcData) {
    const pickaxeNames = [
        'netherite_pickaxe',
        'diamond_pickaxe',
        'iron_pickaxe',
        'stone_pickaxe',
        'golden_pickaxe',
        'wooden_pickaxe'
    ]

    for (const name of pickaxeNames) {
        const item = mcData.itemsByName[name]
        if (item && bot.inventory.count(item.id) > 0) {
            return item
        }
    }

    return null
}

function resolveCandidateBlocks(mcData, normalized) {
    const candidates = new Map()

    // Exact block match first.
    const exactBlock = mcData.blocksByName[normalized]
    if (exactBlock) {
        candidates.set(exactBlock.id, exactBlock.name)
    }

    // Common ore variants for resource names like coal, iron, diamond, etc.
    const likelyOreNames = [
        `${normalized}_ore`,
        `deepslate_${normalized}_ore`,
        `nether_${normalized}_ore`
    ]

    for (const name of likelyOreNames) {
        const block = mcData.blocksByName[name]
        if (block) candidates.set(block.id, block.name)
    }

    // Fuzzy fallback: any block ending in _ore and containing the term.
    for (const [name, block] of Object.entries(mcData.blocksByName)) {
        if (name === normalized) continue
        if (name.includes(normalized) && name.endsWith('_ore')) {
            candidates.set(block.id, block.name)
        }
    }

    return [...candidates.keys()]
}

async function digResource(bot, targetName, amount = 1, options = {}) {
    const mcData = minecraftData(bot.version)
    const normalized = normalizeName(targetName)

    const targetItem = mcData.itemsByName[normalized]
    const targetItemId = targetItem?.id ?? null

    const candidateBlockIds = resolveCandidateBlocks(mcData, normalized)
    if (candidateBlockIds.length === 0) {
        throw new Error(`[Dig] No diggable block found for: ${normalized}`)
    }

    const maxAttempts = options.maxAttempts ?? 60
    const searchDistance = options.searchDistance ?? 64
    let attempts = 0

    bot.chat(`Digging ${amount} x ${normalized}`)

    const equipIfPossible = async () => {
        const pickaxe = getBestPickaxe(bot, mcData)
        if (!pickaxe) return false

        try {
            const item = bot.inventory.items().find(i => i.type === pickaxe.id)
            if (!item) return false
            await bot.equip(item, 'hand')
            return true
        } catch (err) {
            console.log(`[Dig] Could not equip pickaxe: ${err.message}`)
            return false
        }
    }

    await equipIfPossible()

    while (attempts < maxAttempts) {
        const have = targetItemId ? bot.inventory.count(targetItemId) : 0
        if (targetItemId && have >= amount) {
            console.log(`[Dig] Done (${have}/${amount} ${normalized})`)
            return
        }

        const block = bot.findBlock({
            matching: (b) => candidateBlockIds.includes(b.type),
            maxDistance: searchDistance
        })

        if (!block) {
            const x = bot.entity.position.x + (Math.random() * 10 - 5)
            const y = bot.entity.position.y
            const z = bot.entity.position.z + (Math.random() * 10 - 5)

            try {
                await moveTo(bot, { x, y, z }, 12000, 2)
            } catch (err) {
                console.log(`[Dig] Wander error: ${err.message}`)
            }

            attempts++
            continue
        }

        try {
            const targetPos = block.position.offset(1, 0, 0)
            await moveTo(bot, targetPos, 20000, 2)

            if (!bot.canDigBlock(block)) {
                console.log(`[Dig] Cannot dig ${block.name} at ${block.position}`)
                attempts++
                continue
            }

            await bot.lookAt(block.position.offset(0.5, 0.5, 0.5))

            await equipIfPossible()
            await bot.dig(block)

            await bot.waitForTicks(10)

            const droppedItem = Object.values(bot.entities).find(entity =>
                (entity.type === 'item' || entity.name === 'item') &&
                entity.position.distanceTo(bot.entity.position) < 6
            )

            if (droppedItem) {
                try {
                    await moveTo(bot, droppedItem.position, 12000, 1.5)
                    await bot.waitForTicks(6)
                } catch (err) {
                    console.log(`[Dig] Item pickup move failed: ${err.message}`)
                }
            }
        } catch (err) {
            console.log(`[Dig] Error: ${err.message}`)
        }

        attempts++
    }

    throw new Error(`[Dig] Gave up after ${maxAttempts} attempts while digging ${normalized}`)
}

module.exports = digResource