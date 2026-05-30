const minecraftData = require('minecraft-data')

class InventoryState {
    constructor(bot) {
        this.bot = bot
        this.mcData = minecraftData(bot.version)
    }

    update() {
        const woolCount = this.countItemsByPattern('wool')
        const plankCount = this.countItemsByPattern('planks')
        const bestFood = this.getBestFood()
        return {
            hasFood: bestFood !== null,
            bestFood: bestFood,
            hasBedResources: woolCount >= 3 && plankCount >= 3,
            bedInInventory:
                this.bot.inventory.items().find(item =>
                    item.name.includes('bed')
                ) || null
        }
    }

    countItemsByPattern(pattern) {
        return this.bot.inventory.items()
            .filter(item => item.name.includes(pattern))
            .reduce((sum, item) => sum + item.count, 0)
    }

    getBestFood() {
        let bestFood = null
        let bestFoodPoints = -1

        for (const item of this.bot.inventory.items()) {
            const foodData = this.mcData.foodsByName[item.name]
            if (!foodData) {
                continue
            }

            if (foodData.foodPoints > bestFoodPoints) {
                bestFood = item
                bestFoodPoints = foodData.foodPoints
            }
        }
        return bestFood
    }
}

module.exports = InventoryState