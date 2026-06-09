const InventoryState = require('./InventoryState')
const BotState = require('./BotState')
const TimeState = require('./TimeState')
const ThreatState = require('./ThreatState')
const EnvironmentState = require('./EnvironmentState')
const FoodSourceState = require('./FoodSourceState')

class WorldState {
    constructor(bot) {
        this.bot = bot

        this.modules = [
            new InventoryState(bot),
            new BotState(bot),
            new TimeState(bot),
            new ThreatState(bot),
            new EnvironmentState(bot),
            new FoodSourceState(bot)
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

    printState(mode = 'info') {
        const state = this.getPrintableState()

        if (mode === 'debug') {
            console.log('[State]', state)
            return
        }

        const importantState = {
            health: state.health,
            food: state.food,

            isNight: state.isNight,
            isSleeping: state.isSleeping,
            isSheltered: state.isSheltered,

            threat: state.threat,
            threatDistance: state.threatDistance,

            hasFood: state.hasFood,
            bestFood: state.bestFood,

            bedInInventory: state.bedInInventory,
            craftableBed: state.craftableBed,

            nearbyAnimal: state.nearbyAnimal,
            animalDistance: state.animalDistance
        }

        console.log('[State]', importantState)
    }
}

module.exports = WorldState