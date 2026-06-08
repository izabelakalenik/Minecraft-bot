const DECISION_TYPES = require('../decisionTypes')
const { isRawMeat } = require('../../utils/meat')

class HungerDecisionTree {
    decide(state) {
        if (!state.isHungry && !state.lowHealth) {
            return null
        }

        const reason = state.lowHealth
            ? 'Low health, need regeneration'
            : 'Hungry'

        // already have ready-to-eat food: eat it instead of foraging or cooking
        if (state.hasFood && !isRawMeat(state.bestFood.name)) {
            return {
                type: DECISION_TYPES.EAT_FOOD,
                reason,
                food: state.bestFood
            }
        }

        // best food on hand is raw meat: cook it (more hunger restored, avoids food poisoning)
        if (state.hasRawMeat) {
            return this.cookMeatDecision(state, reason)
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
                amount: state.craftableFoodAmount,
                reason: `${reason}: crafting ${state.craftableFoodAmount} x ${food} from ingredients`
            }
        }

        const amount = state.craftableFoodAmount
        const tableNearby = !!state.nearbyCraftingTable
        const animalAvailable = !!state.nearbyAnimal

        const craftFood = (note) => ({
            type: DECISION_TYPES.CRAFT_FOOD,
            food,
            amount,
            reason: `${reason}: ${note}`
        })

        const huntAnimal = (note) => ({
            type: DECISION_TYPES.FIND_FOOD,
            source: 'animal',
            target: state.nearbyAnimal,
            reason: `${reason}: ${note}`
        })

        if (tableNearby) {
            if (animalAvailable && state.animalDistance <= state.craftingTableDistance) {
                return huntAnimal(`${state.nearbyAnimal.name} closer than crafting table, hunting it`)
            }
            return craftFood(`crafting ${amount} x ${food} at nearby table`)
        }

        if (state.canMakeTable) {
            return craftFood(`building a table from materials to make ${amount} x ${food}`)
        }

        if (animalAvailable) {
            return huntAnimal(`no table or wood, hunting ${state.nearbyAnimal.name} instead`)
        }

        return craftFood(`no animal nearby, gathering wood to craft ${amount} x ${food}`)
    }

    cookMeatDecision(state, reason) {
        const meat = state.rawMeat

        if (!state.hasFuel) {
            return {
                type: DECISION_TYPES.EAT_FOOD,
                food: meat,
                reason: `${reason}: no fuel to cook, eating raw ${meat.name}`
            }
        }

        if (state.nearbyFurnace) {
            return {
                type: DECISION_TYPES.COOK_MEAT,
                furnace: state.nearbyFurnace,
                meat,
                reason: `${reason}: cooking ${meat.name} in nearby furnace`
            }
        }

        if (state.furnaceInInventory) {
            return {
                type: DECISION_TYPES.PLACE_FURNACE,
                name: 'furnace',
                amount: 1,
                reason: `${reason}: placing furnace from inventory to cook ${meat.name}`
            }
        }

        if (state.hasFurnaceResources) {
            return {
                type: DECISION_TYPES.CRAFT_FURNACE,
                item: 'furnace',
                amount: 1,
                reason: `${reason}: no furnace, crafting one to cook ${meat.name}`
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
