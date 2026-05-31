const placeItem = require('./placeItem')

async function buildBridge(bot, decision = {}) {
    const bridgeLength = decision.length || 10
    const bridgeBlocks = ['dirt', 'cobblestone', 'stone', 'gravel', 'sand', 'grass_block']
    
    console.log(`[BuildBridge] Building bridge (length: ${bridgeLength})`)
    bot.chat('Building bridge...')
    
    try {
        const startPos = bot.entity.position.floored()
        const yaw = bot.entity.yaw
        const dir = Math.round(yaw / (Math.PI / 2)) & 3
        
        const directions = [
            { x: 0, z: -1 }, // south
            { x: -1, z: 0 }, // west
            { x: 0, z: 1 },  // north
            { x: 1, z: 0 }   // east
        ]
        
        const offset = directions[dir]
        
        let blockUsed = null
        let blockCount = 0
        
        // Find available block in inventory
        for (const blockName of bridgeBlocks) {
            const item = bot.inventory.items().find(i => i.name === blockName)
            if (item && item.count > 0) {
                blockUsed = blockName
                blockCount = item.count
                break
            }
        }
        
        if (!blockUsed || blockCount === 0) {
            console.log(`[BuildBridge] No suitable blocks found in inventory`)
            throw new Error('No bridge blocks available')
        }
        
        console.log(`[BuildBridge] Using ${blockUsed} (have ${blockCount})`)
        
        const maxBlocks = Math.min(bridgeLength, blockCount)
        let placed = 0
        
        // Place blocks in front of bot to build bridge
        for (let i = 1; i <= maxBlocks; i++) {
            const placePos = startPos.offset(offset.x * i, -1, offset.z * i)
            const blockAtPos = bot.blockAt(placePos)
            
            // Only place if block is air or water/lava
            if (blockAtPos && (blockAtPos.name === 'air' || blockAtPos.name.includes('water') || blockAtPos.name.includes('lava'))) {
                try {
                    await placeItem(bot, {
                        name: blockUsed,
                        amount: 1
                    })
                    placed++
                    console.log(`[BuildBridge] Placed block (${placed}/${maxBlocks})`)
                } catch (err) {
                    console.log(`[BuildBridge] Failed to place block: ${err.message}`)
                    break
                }
            }
            
            await bot.waitForTicks(5)
        }
        
        console.log(`[BuildBridge] Bridge complete (${placed} blocks placed)`)
    } catch (err) {
        console.log(`[BuildBridge] Error: ${err.message}`)
        throw err
    }
}

module.exports = buildBridge
