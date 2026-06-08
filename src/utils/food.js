const CRAFTABLE_FOODS = [
    { name: 'bread', ingredients: { wheat: 3 }, requiresTable: true },
    { name: 'pumpkin_pie', ingredients: { pumpkin: 1, sugar: 1, egg: 1 }, requiresTable: false },
    { name: 'cookie', ingredients: { wheat: 2, cocoa_beans: 1 }, requiresTable: true },
    { name: 'beetroot_soup', ingredients: { beetroot: 6, bowl: 1 }, requiresTable: true },
    { name: 'mushroom_stew', ingredients: { brown_mushroom: 1, red_mushroom: 1, bowl: 1 }, requiresTable: false }
]

function findCraftableFood(counts) {
    for (const food of CRAFTABLE_FOODS) {
        const haveAll = Object.entries(food.ingredients).every(
            ([name, need]) => (counts[name] || 0) >= need
        )

        if (haveAll) return food
    }

    return null
}

// how many portions the current ingredients allow (limited by the scarcest ingredient)
function maxCraftableAmount(food, counts) {
    return Math.min(
        ...Object.entries(food.ingredients).map(
            ([name, need]) => Math.floor((counts[name] || 0) / need)
        )
    )
}

module.exports = {
    CRAFTABLE_FOODS,
    findCraftableFood,
    maxCraftableAmount
}
