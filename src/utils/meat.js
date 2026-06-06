const RAW_TO_COOKED = {
    beef: 'cooked_beef',
    porkchop: 'cooked_porkchop',
    chicken: 'cooked_chicken',
    mutton: 'cooked_mutton',
    rabbit: 'cooked_rabbit',
    cod: 'cooked_cod',
    salmon: 'cooked_salmon'
}

const FUEL_ITEMS = [
    'coal_block',
    'coal',
    'charcoal',
    'mangrove_planks',
    'cherry_planks',
    'dark_oak_planks',
    'acacia_planks',
    'jungle_planks',
    'birch_planks',
    'spruce_planks',
    'oak_planks',
    'stick',
]

function isRawMeat(itemName) {
    return Object.prototype.hasOwnProperty.call(RAW_TO_COOKED, itemName)
}

function cookedNameFor(rawName) {
    return RAW_TO_COOKED[rawName] || null
}

module.exports = {
    RAW_TO_COOKED,
    FUEL_ITEMS,
    isRawMeat,
    cookedNameFor
}
