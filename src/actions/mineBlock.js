const moveTo = require('../movement/navigator')

async function mineBlock(bot, mcData, task) {
    const blockName = task.blockName
    const amountNeeded = task.amount || 1

    const blockId = mcData.blocksByName[blockName]?.id

    if (!blockId) {
        throw new Error(`[MineBlock] Unknown block name: ${blockName}`)
    }

    console.log(`[MineBlock] Mining ${amountNeeded} x ${blockName}`)
    bot.chat(`Mining ${amountNeeded} x ${blockName}`)

    let collected = 0
    let attempts = 0

    while (collected < amountNeeded && attempts < 50) {
        const itemId = mcData.itemsByName[blockName]?.id
        const count = itemId ? bot.inventory.count(itemId) : 0

        if (count >= amountNeeded) {
            console.log(`[MineBlock] Collected ${count}/${amountNeeded}`)
            break
        }

        console.log(`[MineBlock] Searching for block (have ${count}/${amountNeeded})`)
        const block = bot.findBlock({
            matching: blockId,
            maxDistance: 128
        })

        if (!block) {
            console.log(`[MineBlock] No block found, wandering...`)
            const x = bot.entity.position.x + (Math.random() * 15 - 7.5)
            const y = bot.entity.position.y
            const z = bot.entity.position.z + (Math.random() * 15 - 7.5)
            
            try {
                await moveTo(bot, { x, y, z }, 15000, 2)
            } catch (err) {
                console.log(`[MineBlock] Wander failed: ${err.message}`)
            }
            attempts++
            continue
        }

        try {
            const target = block.position.offset(1, 0, 0)
            console.log(`[MineBlock] Moving to block at ${block.position.x}, ${block.position.y}, ${block.position.z}`)
            
            await moveTo(bot, target, 20000, 2)
            console.log(`[MineBlock] At block, digging...`)
            
            await bot.lookAt(block.position.offset(0.5, 0.5, 0.5))
            
            if (bot.canDigBlock(block)) {
                await bot.dig(block)
                collected++
                console.log(`[MineBlock] Dug block (${collected}/${amountNeeded})`)
            } else {
                console.log(`[MineBlock] Cannot dig block`)
            }
            
            await bot.waitForTicks(15)
        } catch (err) {
            console.log(`[MineBlock] Error: ${err.message}`)
        }
        
        attempts++
    }

    console.log(`[MineBlock] Finished (${collected} collected, ${attempts} attempts)`)
}

module.exports = mineBlock