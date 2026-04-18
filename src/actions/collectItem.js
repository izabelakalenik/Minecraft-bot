const moveTo = require('../movement/navigator')

// WARNING: If the bot cannot reach the block (e. g. wood is too high) 
// or the block is not available in the area,
// bot stops trying to collect it, waits for timeouts maxAttempts to expire and goes to the next task.

async function collectItem(bot, mcData, task) {
    const blockName = task.blockName
    const amountNeeded = task.amount || 1

    const itemId = mcData.itemsByName[blockName]?.id
    const blockId = mcData.blocksByName[blockName]?.id

    if (!itemId || !blockId) {
        throw new Error(`[CollectItem] Unknown block or item: ${blockName}`)
    }

    bot.chat(`I'm going to collect ${amountNeeded} x ${blockName}`)

    const maxAttempts = 5
    let attempts = 0

    while (attempts < maxAttempts) {
        const count = bot.inventory.count(itemId)

        if (count >= amountNeeded) {
            console.log(`[CollectItem] I already have ${count}/${amountNeeded} ${blockName}`)
            bot.chat(`I already have ${amountNeeded} x ${blockName}`)
            return
        }

        console.log(`[CollectItem] I have ${count}/${amountNeeded} ${blockName}`)

        const block = bot.findBlock({
            matching: blockId,
            maxDistance: 96
        })

        if (!block) {
            const x = bot.entity.position.x + (Math.random() * 10 - 5)
            const y = bot.entity.position.y
            const z = bot.entity.position.z + (Math.random() * 10 - 5)

            try {
                await moveTo(bot, { x, y, z }, 12000, 2)
            } catch (err) {
                console.log(`[CollectItem] Wander error: ${err.message}`)
            }

            attempts++
            continue
        }

        try {
            const targetPos = block.position.offset(1, 0, 0)
            await moveTo(bot, targetPos, 20000, 2)
            await bot.lookAt(block.position.offset(0.5, 0.5, 0.5))

            if (bot.canDigBlock(block)) {
                await bot.dig(block)
            }

            await bot.waitForTicks(10)

            const droppedItem = Object.values(bot.entities).find(entity =>
                (entity.type === 'item' || entity.name === 'item') &&
                entity.position.distanceTo(bot.entity.position) < 6
            )

            if (droppedItem) {
                await moveTo(bot, droppedItem.position, 12000, 1.5)
                await bot.waitForTicks(6)
            }
        } catch (err) {
            console.log(`[CollectItem] Error: ${err.message}`)
        }

        attempts++
    }

    console.log(`[CollectItem] Stopped collectItem after ${maxAttempts} attempts`)
}

module.exports = collectItem