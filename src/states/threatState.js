const THREAT_DETECTION_DISTANCE = 20
const FIGHT_DISTANCE = 5

class ThreatState {
    constructor(bot) {
        this.bot = bot
    }

    update() {
        const threats = this.findThreats()
        const threat = threats[0] || null

        const threatDistance = threat
            ? this.bot.entity.position.distanceTo(threat.position)
            : null

        return {
            threat,
            threats,
            threatDistance,
            threatIsClose:
                threatDistance !== null &&
                threatDistance <= FIGHT_DISTANCE
        }
    }

    findThreats() {
        return Object.values(this.bot.entities)
            .filter(entity => this.isHostileNearby(entity))
            .sort((a, b) => {
                const distanceA =
                    this.bot.entity.position.distanceTo(a.position)

                const distanceB =
                    this.bot.entity.position.distanceTo(b.position)

                return distanceA - distanceB
            })
    }

    isHostileNearby(entity) {
        if (!entity.name) return false

        const distance =
            this.bot.entity.position.distanceTo(entity.position)

        return (
            HOSTILE_MOBS.includes(entity.name) &&
            distance <= THREAT_DETECTION_DISTANCE
        )
    }
}

const HOSTILE_MOBS = [
    'zombie',
    'zombie_villager',
    'zombie_horse',
    'baby_zombie',
    'skeleton',
    'creeper',
    'spider',
    'witch',
    'drowned',
    'phantom',
    'enderman'
]

module.exports = ThreatState