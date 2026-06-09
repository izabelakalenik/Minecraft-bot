const { pathfinder, Movements } = require('mineflayer-pathfinder')
const mcDataLoader = require('minecraft-data')

function enableDoors(move, mcData) {
    for (const block of mcData.blocksArray) {
        // iron doors need redstone, they can't be opened by right-clicking
        if (block.name.endsWith('_door') && !block.name.startsWith('iron')) {
            move.openable.add(block.id)
        }
    }

    move.canOpenDoors = false

    const openableIds = move.openable
    const baseGetBlock = move.getBlock.bind(move)

    move.getBlock = (pos, dx, dy, dz) => {
        const block = baseGetBlock(pos, dx, dy, dz)

        if (block && openableIds.has(block.type)) {
            block.safe = true
            block.physical = false
        }

        return block
    }

    for (const id of openableIds) {
        move.blocksCantBreak.add(id)
    }

    return openableIds
}

function isClosed(block) {
    const open = block.getProperties().open
    return open === false || open === 'false'
}

function findClosedDoorAhead(bot, openableIds, range = 4) {
    const base = bot.entity.position.floored()

    let closest = null
    let closestDist = Infinity

    for (let dy = -1; dy <= 2; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            for (let dz = -range; dz <= range; dz++) {
                const block = bot.blockAt(base.offset(dx, dy, dz))
                if (!block || !openableIds.has(block.type) || !isClosed(block)) continue

                const dist = block.position.distanceTo(bot.entity.position)
                if (dist < closestDist) {
                    closest = block
                    closestDist = dist
                }
            }
        }
    }

    return closest
}

function setupDoorOpener(bot, openableIds) {
    let busy = false
    let cooldownUntil = 0

    bot.on('physicsTick', () => {
        if (busy || Date.now() < cooldownUntil) return
        if (!bot.pathfinder || !bot.pathfinder.isMoving()) return

        const door = findClosedDoorAhead(bot, openableIds)
        if (!door) return

        busy = true
        const p = door.position
        bot.activateBlock(door)
            .then(() => console.log(`[DoorOpener] Opened ${door.name} at ${p.x},${p.y},${p.z}`))
            .catch(err => console.log(`[DoorOpener] Failed to open ${door.name} at ${p.x},${p.y},${p.z}: ${err.message}`))
            .finally(() => {
                cooldownUntil = Date.now() + 500
                busy = false
            })
    })
}

function setupPathfinder(bot) {
    bot.loadPlugin(pathfinder)

    const mcData = mcDataLoader(bot.version)

    const defaultMove = new Movements(bot, mcData)
    defaultMove.canDig = true
    defaultMove.digCost = 10
    defaultMove.allow1by1towers = true
    defaultMove.allowSprinting = true
    defaultMove.allowFreeMotion = false

    const openableIds = enableDoors(defaultMove, mcData)

    const lava = mcData.blocksByName.lava
    if (lava && defaultMove.blocksToAvoid && typeof defaultMove.blocksToAvoid.add === 'function') {
        defaultMove.blocksToAvoid.add(lava.id)
    }

    // a high cost makes the bot prefer dry routes (and reduces drowning),
    // but it will still swim across when that is the only way to reach the goal
    defaultMove.liquidCost = 5

    bot.pathfinder.setMovements(defaultMove)

    bot.pathfinder.thinkTimeout = 20000

    setupDoorOpener(bot, openableIds)

    return mcData
}

module.exports = setupPathfinder
