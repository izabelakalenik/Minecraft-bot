const minecraftData = require('minecraft-data')
const moveTo = require('../movement/navigator')
const craftItem = require('./craftItem')
const { blockingObstacleToward } = require('../utils/terrain')
const { collectDrops } = require('../utils/drops')

function normalizeName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/^minecraft:/, '')
}

const PICKAXE_ORDER = [
    'wooden_pickaxe',
    'stone_pickaxe',
    'iron_pickaxe',
    'diamond_pickaxe',
    'netherite_pickaxe'
]

const PICKAXE_RANK = new Map(PICKAXE_ORDER.map((name, index) => [name, index]))

const OWNED_PICKAXE_ORDER = [
    'netherite_pickaxe',
    'diamond_pickaxe',
    'iron_pickaxe',
    'golden_pickaxe',
    'stone_pickaxe',
    'wooden_pickaxe'
]

function resolveCandidateBlocks(mcData, normalized) {
    const candidates = new Map()

    const exactBlock = mcData.blocksByName[normalized]
    if (exactBlock) candidates.set(exactBlock.id, exactBlock.name)

    for (const name of [
        `${normalized}_ore`,
        `deepslate_${normalized}_ore`,
        `nether_${normalized}_ore`
    ]) {
        const block = mcData.blocksByName[name]
        if (block) candidates.set(block.id, block.name)
    }

    for (const [name, block] of Object.entries(mcData.blocksByName)) {
        if (name !== normalized && name.includes(normalized) && name.endsWith('_ore')) {
            candidates.set(block.id, block.name)
        }
    }

    return [...candidates.keys()]
}

function getItemByName(mcData, name) {
    return mcData.itemsByName[name] || null
}

function findRequiredPickaxeName(block, mcData) {
    for (const name of PICKAXE_ORDER) {
        const item = getItemByName(mcData, name)
        if (item && typeof block.canHarvest === 'function' && block.canHarvest(item.id)) {
            return name
        }
    }
    return null
}

function findBestOwnedPickaxeName(block, bot, mcData) {
    for (const name of OWNED_PICKAXE_ORDER) {
        const item = getItemByName(mcData, name)
        if (!item) continue

        const invItem = bot.inventory.items().find(i => i.type === item.id)
        if (!invItem) continue

        if (typeof block.canHarvest === 'function' && block.canHarvest(item.id)) {
            return name
        }
    }
    return null
}

function effectiveDurability(item) {
    if (!item || typeof item.maxDurability !== 'number') return 0
    const used = typeof item.durabilityUsed === 'number' ? item.durabilityUsed : 0
    return Math.max(0, item.maxDurability - used)
}

async function equipPickaxe(bot, mcData, pickaxeName) {
    const item = getItemByName(mcData, pickaxeName)
    if (!item) throw new Error(`[Dig] Unknown pickaxe: ${pickaxeName}`)

    const invItem = bot.inventory.items().find(i => i.type === item.id)
    if (!invItem) return false

    await bot.equip(invItem, 'hand')
    return true
}

function findClosestTargetBlock(bot, candidateBlockIds, maxDistance = 64, count = 20) {
    const positions = bot.findBlocks({
        matching: (b) => candidateBlockIds.includes(b.type),
        maxDistance,
        count
    })

    for (const pos of positions) {
        const block = bot.blockAt(pos)
        if (block) return block
    }

    return null
}

function chooseTravelPickaxe(requiredPickaxeName) {
    if (!requiredPickaxeName) return null

    if ((PICKAXE_RANK.get(requiredPickaxeName) ?? 0) >= PICKAXE_RANK.get('stone_pickaxe')) {
        return 'stone_pickaxe'
    }

    return requiredPickaxeName
}

async function ensureToolBudget(bot, mcData, targetBlock, targetPos, options = {}, stack = new Set()) {
    const requiredPickaxe = findRequiredPickaxeName(targetBlock, mcData)
    if (!requiredPickaxe) return { travelPickaxe: null, reservePickaxe: null }

    const travelPickaxe = chooseTravelPickaxe(requiredPickaxe)

    const safetyMultiplier = options.toolSafetyMultiplier ?? 1.35
    const buffer = options.toolBuffer ?? 24
    const estimatedBlocks = Math.ceil(bot.entity.position.distanceTo(targetPos) * safetyMultiplier) + buffer

    const travelItem = getItemByName(mcData, travelPickaxe)
    if (!travelItem) throw new Error(`[Dig] Missing item data for ${travelPickaxe}`)

    let travelInvItem = bot.inventory.items().find(i => i.type === travelItem.id)
    let travelDurability = effectiveDurability(travelInvItem)

    if (travelDurability <= 0) {
        console.log(`[Dig] Crafting one ${travelPickaxe} to measure/ensure travel tool`)
        await craftItem(bot, travelPickaxe, 1, options, stack)
        travelInvItem = bot.inventory.items().find(i => i.type === travelItem.id)
        travelDurability = effectiveDurability(travelInvItem)
    }

    const perTool = Math.max(1, travelDurability || travelItem.maxDurability || 1)
    const wantedTravelTools = Math.max(1, Math.ceil(estimatedBlocks / perTool))

    const currentTravelTools = bot.inventory.count(travelItem.id)
    if (currentTravelTools < wantedTravelTools) {
        const missing = wantedTravelTools - currentTravelTools
        console.log(`[Dig] Pre-crafting ${missing} extra ${travelPickaxe}(s) for travel`)
        await craftItem(bot, travelPickaxe, wantedTravelTools, options, stack)
    }

    if (requiredPickaxe !== travelPickaxe) {
        const reserveItem = getItemByName(mcData, requiredPickaxe)
        if (!reserveItem) throw new Error(`[Dig] Missing item data for ${requiredPickaxe}`)

        if (bot.inventory.count(reserveItem.id) < 1) {
            console.log(`[Dig] Crafting reserved ${requiredPickaxe} for the target block`)
            await craftItem(bot, requiredPickaxe, 1, options, stack)
        }
    }

    await equipPickaxe(bot, mcData, travelPickaxe)
    return { travelPickaxe, reservePickaxe: requiredPickaxe }
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

    while (attempts < maxAttempts) {
        if (bot._aiAbort) {
            console.log('[Dig] Aborted for a higher-priority action')
            return
        }

        const have = targetItemId ? bot.inventory.count(targetItemId) : 0
        if (targetItemId && have >= amount) {
            console.log(`[Dig] Done (${have}/${amount} ${normalized})`)
            return
        }

        const preflightBlock = findClosestTargetBlock(bot, candidateBlockIds, searchDistance, 20)
        if (preflightBlock) {
            await ensureToolBudget(bot, mcData, preflightBlock, preflightBlock.position, options)
        }

        const block = bot.findBlock({
            matching: candidateBlockIds,
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

            const liveBlock = bot.blockAt(block.position) || block
            if (!bot.canDigBlock(liveBlock)) {
                console.log(`[Dig] Cannot dig ${liveBlock.name} at ${liveBlock.position}`)
                attempts++
                continue
            }

            const requiredPickaxe = findRequiredPickaxeName(liveBlock, mcData)
            const travelPickaxe = chooseTravelPickaxe(requiredPickaxe)

            if (requiredPickaxe && requiredPickaxe !== travelPickaxe) {
                const reserveItem = getItemByName(mcData, requiredPickaxe)
                const reserveInv = reserveItem && bot.inventory.items().find(i => i.type === reserveItem.id)
                if (reserveInv) {
                    await bot.equip(reserveInv, 'hand')
                }
            } else if (travelPickaxe) {
                await equipPickaxe(bot, mcData, travelPickaxe)
            }

            await bot.lookAt(liveBlock.position.offset(0.5, 0.5, 0.5))
            await bot.dig(liveBlock)

            await bot.waitForTicks(10)

            await collectDrops(bot, liveBlock.position)
        } catch (err) {
            console.log(`[Dig] Error: ${err.message}`)

            if (/no ?path/i.test(err.message) && !bot.manualMode?.isEnabled()) {
                const obstacle = blockingObstacleToward(bot, block.position)
                if (obstacle) {
                    bot._blockedRoute = {
                        obstacle,
                        target: { x: block.position.x, y: block.position.y, z: block.position.z }
                    }
                    console.log(`[Dig] Blocked by ${obstacle} - deferring crossing to the decision tree`)
                    return
                }
            }
        }

        attempts++
    }

    throw new Error(`[Dig] Gave up after ${maxAttempts} attempts while digging ${normalized}`)
}

module.exports = digResource