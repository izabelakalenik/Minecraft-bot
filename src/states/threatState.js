const THREAT_DETECTION_DISTANCE = 16
const FIGHT_DISTANCE = 5

class ThreatState {
    constructor(bot) {
        this.bot = bot
    }

    update() {
        const threat = this.findThreat()
        const threatDistance = threat
            ? this.bot.entity.position.distanceTo(threat.position)
            : null

        return {
            threat,
            threatDistance,
            threatIsClose:
                threatDistance !== null &&
                threatDistance <= FIGHT_DISTANCE
        }
    }

    findThreat() {
        const hostileMobs = [
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
            'enderman',
        ]

        return this.bot.nearestEntity(entity => {
            if (!entity.name) return false

            const distance = this.bot.entity.position.distanceTo(entity.position)

            return (
                hostileMobs.includes(entity.name) &&
                distance <= THREAT_DETECTION_DISTANCE
            )
        })
    }
}

module.exports = ThreatState