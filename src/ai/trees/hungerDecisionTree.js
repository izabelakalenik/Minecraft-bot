const DECISION_TYPES = require('../decisionTypes')

class HungerDecisionTree {
    decide(state) {
        if (!state.isHungry && !state.lowHealth) {
            return null
        }

        if (state.hasFood) {
            return {
                type: DECISION_TYPES.EAT_FOOD,
                reason: state.lowHealth
                    ? 'Low health, need regeneration'
                    : 'Hungry'
            }
        }

        return {
            type: DECISION_TYPES.FIND_FOOD,
            reason: 'No food available'
        }
    }
}

module.exports = HungerDecisionTree

module.exports = HungerDecisionTree