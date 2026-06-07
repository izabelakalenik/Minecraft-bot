const minecraftData = require('minecraft-data')
const { isRawMeat, FUEL_ITEMS } = require('../utils/meat')
const { findCraftableFood, maxCraftableAmount } = require('../utils/food')

const FURNACE_COBBLESTONE_COST = 8

class InventoryState {
    constructor(bot) {
        this.bot = bot
        this.mcData = minecraftData(bot.version)
    }

    update() {
        const woolCount = this.countItemsByPattern('wool')
        const plankCount = this.countItemsByPattern('planks')
        const cobblestoneCount = this.countItemsByName('cobblestone')
        const bestFood = this.getBestFood()
        const rawMeat = this.getRawMeat()
        const craftableFood = this.getCraftableFood()
        return {
            hasFood: bestFood !== null,
            bestFood: bestFood,
            rawMeat: rawMeat,
            hasRawMeat: rawMeat !== null,
            hasFuel: this.hasFuel(),
            craftableFood: craftableFood ? craftableFood.name : null,
            craftableFoodNeedsTable: craftableFood ? craftableFood.requiresTable : false,
            craftableFoodAmount: craftableFood ? craftableFood.amount : 0,
            hasFurnaceResources: cobblestoneCount >= FURNACE_COBBLESTONE_COST,
            hasBedResources: woolCount >= 3 && plankCount >= 3,
            bedInInventory:
                this.bot.inventory.items().find(item =>
                    item.name.includes('bed')
                ) || null,
            furnaceInInventory:
                this.bot.inventory.items().find(item =>
                    item.name === 'furnace'
                ) || null
        }
    }

    countItemsByName(name) {
        return this.bot.inventory.items()
            .filter(item => item.name === name)
            .reduce((sum, item) => sum + item.count, 0)
    }

    getRawMeat() {
        return this.bot.inventory.items().find(item =>
            isRawMeat(item.name)
        ) || null
    }

    hasFuel() {
        return this.bot.inventory.items().some(item =>
            FUEL_ITEMS.includes(item.name)
        )
    }

    getCraftableFood() {
        const counts = {}
        for (const item of this.bot.inventory.items()) {
            counts[item.name] = (counts[item.name] || 0) + item.count
        }

        const food = findCraftableFood(counts)
        if (!food) return null

        return {
            name: food.name,
            requiresTable: food.requiresTable,
            amount: maxCraftableAmount(food, counts)
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