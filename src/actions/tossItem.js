async function tossItem(bot, decision) {
    const itemName = decision.name
    const amount = decision.amount

    const item = bot.inventory.items().find(item =>
        item.name === itemName
    )

    if (!item) {
        console.log(`[TossItem] No ${itemName} found`)
        return
    }

    try {
        await bot.toss(item.type, null, amount)

        console.log(
            `[TossItem] Tossed ${amount} x ${itemName}`
        )

    } catch (err) {
        console.log(
            `[TossItem] Cannot toss item: ${err.message}`
        )
    }
}

module.exports = tossItem