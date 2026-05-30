const { Vec3 } = require('vec3')

function isAir(block) {
    return (
        block &&
        ['air', 'cave_air', 'void_air'].includes(block.name)
    )
}

async function placeItem(bot, decision) {
    const itemName = decision.name

    const item = bot.inventory.items().find(item =>
        item.name === itemName
    )

    if (!item) {
        throw new Error(`No ${itemName}`)
    }

    await bot.equip(item, 'hand')

    const pos = bot.entity.position.floored()

    const positions = [
        pos.offset(1, 0, 0),
        pos.offset(-1, 0, 0),
        pos.offset(0, 0, 1),
        pos.offset(0, 0, -1),

        pos.offset(1, 1, 0),
        pos.offset(-1, 1, 0),
        pos.offset(0, 1, 1),
        pos.offset(0, 1, -1)
    ]

    for (const targetPos of positions) {
        const targetBlock = bot.blockAt(targetPos)

        if (!isAir(targetBlock)) continue

        const referenceBlock = bot.blockAt(targetPos.offset(0, -1, 0))

        if (!referenceBlock || isAir(referenceBlock)) continue

        try {
            await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0))

            console.log(`[PlaceItem] Placed ${itemName} at ${targetPos}`)
            return
        } catch (err) {
            console.log(
                `[PlaceItem] Failed at ${targetPos}: ${err.message}`
            )
        }
    }

    throw new Error(`No valid place found for ${itemName}`)
}

module.exports = placeItem