const DECISION_TYPES = require('../decisionTypes')

class HungerDecisionTree {
    decide(state) {
        if (!state.isHungry && !state.lowHealth) {
            return null
        }

        const reason = state.lowHealth
            ? 'Low health, need regeneration'
            : 'Hungry'

        if (state.hasFood) {
            return {
                type: DECISION_TYPES.EAT_FOOD,
                reason,
                food: state.bestFood
            }
        }

        return this.findFoodDecision(state, reason)
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
