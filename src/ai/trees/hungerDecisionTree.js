const DECISION_TYPES = require('../decisionTypes')

class HungerDecisionTree {
    decide(state) {
        if (!state.isHungry && !state.lowHealth) {
            return null
        }

        const reason = state.lowHealth
            ? 'Low health, need regeneration'
            : 'Hungry'

        // cooked meat restores more hunger
        if (state.hasRawMeat) {
            return this.cookMeatDecision(state, reason)
        }

        if (state.hasFood) {
            return {
                type: DECISION_TYPES.EAT_FOOD,
                reason,
                food: state.bestFood
            }
        }

        if (state.craftableFood) {
            return this.craftFoodDecision(state, reason)
        }

        return this.findFoodDecision(state, reason)
    }

    craftFoodDecision(state, reason) {
        const food = state.craftableFood

        if (!state.craftableFoodNeedsTable) {
            return {
                type: DECISION_TYPES.CRAFT_FOOD,
                food,
                reason: `${reason}: crafting ${food} from ingredients`
            }
        }

        // if an animal is closer than the crafting table, hunting it is the faster meal
        const tableNearby = !!state.nearbyCraftingTable
        const animalAvailable = !!state.nearbyAnimal

        const huntInstead =
            animalAvailable &&
            (!tableNearby || state.animalDistance <= state.craftingTableDistance)

        if (huntInstead) {
            return {
                type: DECISION_TYPES.FIND_FOOD,
                source: 'animal',
                target: state.nearbyAnimal,
                reason: `${reason}: ${state.nearbyAnimal.name} closer than crafting table, hunting it`
            }
        }

        return {
            type: DECISION_TYPES.CRAFT_FOOD,
            food,
            reason: tableNearby
                ? `${reason}: crafting ${food} at nearby table`
                : `${reason}: crafting a table to make ${food}`
        }
    }

    cookMeatDecision(state, reason) {
        const meat = state.rawMeat

        if (state.nearbyFurnace) {
            return {
                type: DECISION_TYPES.COOK_MEAT,
                furnace: state.nearbyFurnace,
                meat,
                reason: `${reason}: cooking ${meat.name} in nearby furnace`
            }
        }

        if (state.hasFurnaceResources && state.hasFuel) {
            return {
                type: DECISION_TYPES.CRAFT_FURNACE,
                meat,
                reason: `${reason}: no furnace nearby, crafting one to cook ${meat.name}`
            }
        }

        return {
            type: DECISION_TYPES.EAT_FOOD,
            food: meat,
            reason: `${reason}: no furnace or resources, eating raw ${meat.name}`
        }
    }

    findFoodDecision(state, reason) {
        const cropAvailable = !!state.nearbyCrop
        const animalAvailable = !!state.nearbyAnimal

        // hunt animals when they are nearer
        const huntAnimal =
            animalAvailable &&
            (!cropAvailable || state.animalDistance <= state.cropDistance)

        if (huntAnimal) {
            return {
                type: DECISION_TYPES.FIND_FOOD,
                source: 'animal',
                target: state.nearbyAnimal,
                reason: `${reason}: hunting ${state.nearbyAnimal.name} nearby`
            }
        }

        if (cropAvailable) {
            return {
                type: DECISION_TYPES.FIND_FOOD,
                source: 'crop',
                target: state.nearbyCrop,
                reason: `${reason}: harvesting ${state.nearbyCrop.name} nearby`
            }
        }

        return {
            type: DECISION_TYPES.FIND_FOOD,
            source: 'search',
            reason: `${reason}: no food source nearby, searching`
        }
    }
}

module.exports = HungerDecisionTree
