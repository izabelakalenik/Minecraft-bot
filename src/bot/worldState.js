const LOW_HEALTH_LEVEL = 10
const HUNGER_LEVEL = 14
const NIGHT_START = 13000
const NIGHT_END = 23000

const THREAT_DETECTION_DISTANCE = 16
const FIGHT_DISTANCE = 5
const BED_SEARCH_DISTANCE = 16

class WorldState {
    constructor(bot) {
        this.bot = bot
        this.update()
    }

    update() {
        this.checkThreatNearby()
        this.checkLowHealth()
        this.checkIsNight()
        this.checkIsHungry()
        this.checkIsBedNearby()
        this.checkHasBedResources()
        this.checkIsSheltered()
        this.checkIsSleeping()
    }

    printState() {
        const state = { ...this }
        delete state.bot
        console.log('[State]', state)
    }

    checkThreatNearby() {
        const hostileMobs = [
            'zombie',
            'skeleton',
            'creeper',
            'spider',
            'witch',
            'drowned'
        ]

        this.threat = this.bot.nearestEntity(entity => {
            if (!entity.name) return

            const distance = this.bot.entity.position.distanceTo(entity.position)

            return hostileMobs.includes(entity.name) && distance <= THREAT_DETECTION_DISTANCE
        })

        this.threatDistance = this.threat
            ? this.bot.entity.position.distanceTo(this.threat.position)
            : null

        this.threatIsClose =
            this.threatDistance !== null &&
            this.threatDistance <= FIGHT_DISTANCE
    }

    checkLowHealth() {
        this.health = this.bot.health
        this.lowHealth = this.bot.health <= LOW_HEALTH_LEVEL
    }

    checkIsNight() {
        const time = this.bot.time.timeOfDay
        this.time = time
        this.isNight = time >= NIGHT_START && time <= NIGHT_END
    }

    checkIsHungry() {
        this.food = this.bot.food
        this.isHungry =  this.bot.food <= HUNGER_LEVEL
    }

    checkIsBedNearby() {
        this.bedNearby = this.bot.findBlock({
            matching: block => block && block.name.includes('bed'),
            maxDistance: BED_SEARCH_DISTANCE
        })
    }

    checkHasBedResources() {
        const woolCount = this.countItemsByPattern('wool')
        const plankCount = this.countItemsByPattern('planks')

        this.hasBedResources =  woolCount >= 3 && plankCount >= 3
    }

    countItemsByPattern(pattern) {
        return this.bot.inventory.items()
            .filter(item => item.name.includes(pattern))
            .reduce((sum, item) => sum + item.count, 0)
    }

    checkIsSheltered() {
        const pos = this.bot.entity.position.floored()
        const blocksToCheck = [
            // roof
            pos.offset(0, 2, 0),

            // lower walls (legs)
            pos.offset(1, 0, 0),
            pos.offset(-1, 0, 0),
            pos.offset(0, 0, 1),
            pos.offset(0, 0, -1),

            // upper walls (head)
            pos.offset(1, 1, 0),
            pos.offset(-1, 1, 0),
            pos.offset(0, 1, 1),
            pos.offset(0, 1, -1)
        ]

        const solidBlocks = blocksToCheck.filter(blockPos => {
            const block = this.bot.blockAt(blockPos)

            return (
                block &&
                block.name !== 'air' &&
                block.name !== 'cave_air' &&
                block.name !== 'void_air'
            )
        })

        this.isSheltered = solidBlocks.length === blocksToCheck.length
    }

    checkIsSleeping() {
        this.isSleeping = this.bot.isSleeping
    }
}

module.exports = WorldState