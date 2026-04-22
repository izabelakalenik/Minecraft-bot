async function unequipItem(bot, mcData, task) {
    const slots = ['hand', 'head', 'torso', 'legs', 'feet', 'off-hand']

    if (task.slot === 'all') {
        for (const slot of slots) {
            try {
                await bot.unequip(slot)
            } catch (err) {
                console.log(`[UnequipItem] Error unequipping ${slot}: ${err.message}`)
            }
        }
        console.log(`[UnequipItem] All items unequipped`)
        return
    }

    try {
        await bot.unequip(task.slot)
        console.log(`[UnequipItem] Unequipped: ${task.slot}`)
    } catch (err) {
        console.log(`[UnequipItem] Error unequipping ${task.slot}: ${err.message}`)
    }
}

module.exports = unequipItem