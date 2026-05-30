const InventoryState = require('./InventoryState')
const BotState = require('./BotState')
const TimeState = require('./TimeState')
const ThreatState = require('./ThreatState')
const EnvironmentState = require('./EnvironmentState')

class WorldState {
    constructor(bot) {
        this.bot = bot

        this.modules = [
            new InventoryState(bot),
            new BotState(bot),
            new TimeState(bot),
            new ThreatState(bot),
            new EnvironmentState(bot)
        ]

        this.update()
    }

    update() {
        for (const module of this.modules) {
            Object.assign(this, module.update())
        }
    }

    getPrintableState() {
        const state = {}

        for (const [key, value] of Object.entries(this)) {
            if (key === 'bot' || key === 'modules') {
                continue
            }

            if (value && typeof value === 'object') {
                state[key] = value.name ?? '[object]'
            } else {
                state[key] = value
            }
        }

        return state
    }

    printState() {
        console.log('[State]', this.getPrintableState())
    }
}

module.exports = WorldState