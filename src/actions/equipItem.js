async function equipItem(bot, mcData, task) {
    const name = task.item
    const item = bot.inventory.items().find(i => i.name === name)

    if (!item) {
        console.log(`[EquipItem] I don't have ${name} to equip.`)
        return
    }

    await bot.equip(item, 'hand')
    console.log(`[EquipItem] Equipped: ${name}`)
}

async function equipBestWeapon(bot) {
    const priorities = [
        'netherite_sword',
        'diamond_sword',
        'iron_sword',
        'stone_sword',
        'wooden_sword',

        'netherite_axe',
        'diamond_axe',
        'iron_axe',
        'stone_axe',
        'wooden_axe',

        'netherite_pickaxe',
        'diamond_pickaxe',
        'iron_pickaxe',
        'stone_pickaxe',
        'wooden_pickaxe'
    ]

    const items = bot.inventory.items()

    for (const weaponName of priorities) {
        const weapon = items.find(item => item.name === weaponName)

        if (weapon) {
            await bot.equip(weapon, 'hand')
            console.log(`[EquipBestWeapon] Equipped ${weapon.name}`)
            return
        }
    }
    bot.unequip('hand')
    console.log('[EquipBestWeapon] No weapon found, fighting with hand')
}


module.exports = {
    equipItem,
    equipBestWeapon
}