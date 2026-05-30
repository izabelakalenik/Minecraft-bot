async function unequipItem(bot, decision) {
    const slots = ['hand', 'head', 'torso', 'legs', 'feet', 'off-hand']
    if (decision.slot === 'all') {
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
        await bot.unequip(decision.slot)
        console.log(`[UnequipItem] Unequipped: ${decision.slot}`)
    } catch (err) {
        console.log(`[UnequipItem] Error unequipping ${decision.slot}: ${err.message}`)
    }
}

module.exports = unequipItem