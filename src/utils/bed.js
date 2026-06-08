const OCCUPANT_RANGE = 3 // how close an entity must be to a bed to count as its occupant

function isBed(block) {
    return !!block && block.name.includes('bed')
}

function isBedOccupied(block) {
    if (!isBed(block)) return false

    try {
        const props = block.getProperties()
        return props.occupied === true || props.occupied === 'true'
    } catch (e) {
        return false
    }
}

function findNearestBed(bot, maxDistance = 16) {
    return bot.findBlock({
        matching: block => isBed(block),
        maxDistance
    })
}

// closest player/villager sitting in (or right next to) the given bed
function findBedOccupant(bot, bedBlock) {
    const center = bedBlock.position.offset(0.5, 0, 0.5)

    let closest = null
    let closestDist = OCCUPANT_RANGE

    for (const id in bot.entities) {
        const entity = bot.entities[id]
        if (!entity || entity === bot.entity) continue
        if (entity.type !== 'player' && entity.name !== 'villager') continue

        const dist = entity.position.distanceTo(center)
        if (dist < closestDist) {
            closest = entity
            closestDist = dist
        }
    }

    return closest
}

module.exports = {
    isBed,
    isBedOccupied,
    findNearestBed,
    findBedOccupant
}
