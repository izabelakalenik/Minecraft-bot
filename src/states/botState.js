const LOW_HEALTH_LEVEL = 10
const HUNGER_LEVEL = 14

class BotState {
    constructor(bot) {
        this.bot = bot
    }

    update() {
        const pos = this.bot.entity.position.floored()
        return {
            health: this.bot.health,
            lowHealth: this.bot.health <= LOW_HEALTH_LEVEL,

            food: this.bot.food,
            isHungry: this.bot.food <= HUNGER_LEVEL,

            isSleeping: this.bot.isSleeping,
            position: `${pos.x}, ${pos.y}, ${pos.z}`
        }
    }
}

module.exports = BotState