const DECISION_TYPES = require('../decisionTypes')

class NightDecisionTree {
    decide(state) {
        if (!state.isNight && state.isSheltered) {
            return {
                type: DECISION_TYPES.LEAVE_SHELTER
            }
        }

        if (!state.isNight) return null

        if (state.isSleeping) {
            return {
                type: DECISION_TYPES.CONTINUE_SLEEPING
            }
        }

        if (state.isSheltered) {
            return {
                type: DECISION_TYPES.STAY_IN_SHELTER
            }
        }

        if (state.bedNearby) {
            return {
                type: DECISION_TYPES.SLEEP,
                bed: state.bedNearby
            }
        }

        if (state.bedInInventory) {
            return {
                type: DECISION_TYPES.PLACE_BED,
                name: state.bedInInventory.name,
                amount: 1
            }
        }

        if (state.hasBedResources) {
            return {
                type: DECISION_TYPES.CRAFT_BED
            }
        }

        return {
            type: DECISION_TYPES.BUILD_SHELTER
        }
    }
}

module.exports = NightDecisionTree