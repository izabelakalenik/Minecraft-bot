async function eatFood(bot, decision) {
    const food = decision.food

    if (!food) {
        console.log('[EatFood] No food in decision')
        return
    }

    try {
        await bot.equip(food, 'hand')
        await bot.consume()

        console.log(
            `[EatFood] Ate ${food.name}. Reason: ${decision.reason}`
        )
    } catch (err) {
        console.log(
            `[EatFood] Cannot eat ${food.name}: ${err.message}`
        )
    }
}

module.exports = eatFood