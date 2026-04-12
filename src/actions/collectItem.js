const moveTo = require('../movement/navigator')

async function collectItem(bot, mcData, task) {
    const blockName = task.blockName
    const amountNeeded = task.amount

    bot.chat(`Ide pozbierać ${amountNeeded} x ${blockName}`)
    
    while (true) {
        const count = bot.inventory.count(
            mcData.itemsByName[blockName].id
        )

        if (count >= amountNeeded) {
            console.log(`Mam juz ${amountNeeded} x ${blockName}`)
            bot.chat(`Mam juz ${amountNeeded} x ${blockName}`)
            break
        } else {
            console.log(`Mam ${count}/${amountNeeded} ${blockName}`)
            bot.chat(`Mam ${count}/${amountNeeded} ${blockName}`)
        }

        const block = bot.findBlock({
            matching: mcData.blocksByName[blockName].id,
            maxDistance: 128
        })

        if (!block) {
            const x = bot.entity.position.x + (Math.random() * 10 - 5)
            const y = bot.entity.position.y
            const z = bot.entity.position.z + (Math.random() * 10 - 5)

            await moveTo(bot, { x, y, z })
            continue
        }

        try {
            const targetPos = block.position.offset(1, 0, 0)
            await moveTo(bot, targetPos)
            await bot.lookAt(block.position.offset(0.5, 0.5, 0.5))

            if (bot.canDigBlock(block)) {
                await bot.dig(block)
            }

            await bot.waitForTicks(10)

            const droppedItem = Object.values(bot.entities).find(entity =>
                entity.name === 'item' &&
                entity.position.distanceTo(bot.entity.position) < 5
            )

            if (droppedItem) {
                await moveTo(bot, droppedItem.position)
            }

        } catch (err) {
            console.log('Błąd:', err.message)
        }
    }
}

module.exports = collectItem