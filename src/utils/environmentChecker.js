/**
 * Check for obstacles and hazards in front of the bot
 */

const fluidBlocks = ['water', 'flowing_water', 'lava', 'flowing_lava']

/**
 * Check if there's water in front of the bot
 * @param {Object} bot - Mineflayer bot instance
 * @param {number} distance - How far ahead to check (default: 3)
 * @returns {Object|null} Water block or null
 */
function checkWaterAhead(bot, distance = 3) {
    const pos = bot.entity.position.floored()
    
    // Check blocks in front based on bot's facing direction
    const checkPositions = getFrontPositions(bot, distance)
    
    for (const checkPos of checkPositions) {
        const block = bot.blockAt(checkPos)
        
        if (block && (block.name === 'water' || block.name === 'flowing_water')) {
            return block
        }
    }
    return null
}

/**
 * Check if there's lava in front of the bot
 * @param {Object} bot - Mineflayer bot instance
 * @param {number} distance - How far ahead to check (default: 3)
 * @returns {Object|null} Lava block or null
 */
function checkLavaAhead(bot, distance = 3) {
    const checkPositions = getFrontPositions(bot, distance)
    
    for (const checkPos of checkPositions) {
        const block = bot.blockAt(checkPos)
        
        if (block && (block.name === 'lava' || block.name === 'flowing_lava')) {
            return block
        }
    }
    return null
}

/**
 * Get positions ahead of the bot based on its facing direction
 */
function getFrontPositions(bot, distance) {
    const pos = bot.entity.position.floored()
    const yaw = bot.entity.yaw
    const dir = Math.round(yaw / (Math.PI / 2)) & 3
    
    const directions = [
        { x: 0, z: -1 }, // south
        { x: -1, z: 0 }, // west
        { x: 0, z: 1 },  // north
        { x: 1, z: 0 }   // east
    ]
    
    const offset = directions[dir]
    const positions = []
    
    for (let i = 1; i <= distance; i++) {
        positions.push(pos.offset(offset.x * i, 0, offset.z * i))
    }
    
    return positions
}

/**
 * Check if bot can swim (has water in front and inventory space/ability)
 * @param {Object} bot - Mineflayer bot instance
 * @returns {boolean}
 */
function canSwim(bot) {
    const waterAhead = checkWaterAhead(bot, 2)
    return waterAhead !== null
}

/**
 * Check if there's a safe path around an obstacle (left/right/up)
 * @param {Object} bot - Mineflayer bot instance
 * @returns {boolean}
 */
function hasAlternatePath(bot) {
    const botPos = bot.entity.position.floored()
    
    // Check right, left, and up for safe passages
    const checkPositions = [
        botPos.offset(1, 0, 0),   // right
        botPos.offset(-1, 0, 0),  // left
        botPos.offset(0, 1, 0),   // up
        botPos.offset(0, -1, 0),  // down
    ]
    
    for (const pos of checkPositions) {
        const block = bot.blockAt(pos)
        if (!block || block.replaceable) {
            return true
        }
    }
    
    return false
}

/**
 * Find closest safe block in inventory for bridging
 * @param {Object} bot - Mineflayer bot instance
 * @returns {Object|null} {name, count} or null
 */
function findBridgeBlock(bot) {
    const bridgeBlocks = ['dirt', 'cobblestone', 'stone', 'gravel', 'sand']
    
    for (const blockName of bridgeBlocks) {
        const item = bot.inventory.items().find(i => i.name === blockName)
        if (item) {
            return item
        }
    }
    
    return null
}

/**
 * Check inventory for boat or boat materials
 * @param {Object} bot - Mineflayer bot instance
 * @returns {Object} {hasBoat: bool, hasMaterials: bool}
 */
function checkBoatInventory(bot) {
    const hasBoat = bot.inventory.items().some(i => i.name === 'boat')
    
    const woodMaterials = ['oak_planks', 'birch_planks', 'spruce_planks', 'jungle_planks', 'dark_oak_planks', 'acacia_planks']
    const hasMaterials = woodMaterials.some(mat => bot.inventory.items().find(i => i.name === mat))
    
    return { hasBoat, hasMaterials }
}

module.exports = {
    checkWaterAhead,
    checkLavaAhead,
    canSwim,
    hasAlternatePath,
    findBridgeBlock,
    checkBoatInventory,
    fluidBlocks,
    getFrontPositions
}
