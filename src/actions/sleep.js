const moveTo = require('../movement/navigator')

async function sleep(bot, mcData, decision) {
    const bed = decision.bed

    if (!bed) {
        console.log('[Sleep] No bed provided')
        return
    }

    console.log('[Sleep] Going to bed')

    try {
        await moveTo(bot, bed.position, 15000, 2)

        await bot.lookAt(
            bed.position.offset(0.5, 0.5, 0.5)
        )

        await bot.sleep(bed)

        console.log('[Sleep] Bot is sleeping')
        bot.chat('Sleeping...')

    } catch (err) {
        console.log(`[Sleep] Cannot sleep: ${err.message}`)
    }
}

module.exports = sleep