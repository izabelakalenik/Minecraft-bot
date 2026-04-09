const { goals } = require('mineflayer-pathfinder')
const { GoalNear } = goals

async function collectWood(bot, mcData, printInventory) {
    const woodBlockName = 'oak_log'
    const woodNeeded = 3

    return new Promise((resolve, reject) => {
        function collect() {
            const block = bot.findBlock({
                matching: mcData.blocksByName[woodBlockName].id,
                maxDistance: 16
            })

            if (!block) {
                const x = bot.entity.position.x + (Math.random() * 10 - 5)
                const y = bot.entity.position.y
                const z = bot.entity.position.z + (Math.random() * 10 - 5)

                bot.pathfinder.setGoal(new GoalNear(x, y, z, 1))
                bot.once('goal_reached', collect)
                return
            }

            bot.pathfinder.setGoal(
                new GoalNear(block.position.x, block.position.y, block.position.z, 1)
            )

            bot.once('goal_reached', async () => {
                try {
                    await bot.lookAt(block.position.offset(0.5, 0.5, 0.5))
                    await bot.dig(block)

                    console.log(`Mam drewno: ${block.name}`)
                    printInventory(bot)

                    const count = bot.inventory.count(mcData.itemsByName[woodBlockName].id)

                    if (count >= woodNeeded) resolve()
                    else setTimeout(collect, 500)
                } catch (err) {
                    reject(err)
                }
            })
        }

        collect()
    })
}

module.exports = collectWood