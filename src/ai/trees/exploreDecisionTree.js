const DECISION_TYPES = require('../decisionTypes')
const { checkWaterAhead, checkLavaAhead, hasAlternatePath, checkBoatInventory } = require('../../utils/environmentChecker')

class ExploreDecisionTree {
    decide(state) {
        if (state.threat || state.isNight || state.isHungry) {
            return null
        }

        const bot = state.bot

        if (!bot) {
            return { type: DECISION_TYPES.EXPLORE }
        }

        // Check for water ahead
        const waterAhead = checkWaterAhead(bot, 4)
        if (waterAhead) {
            return this.decideWaterAction(bot, state)
        }

        // Check for lava ahead
        const lavaAhead = checkLavaAhead(bot, 4)
        if (lavaAhead) {
            return this.decideLavaAction(bot, state)
        }

        // No obstacles - resolve crafting chain for mining
        return {
            type: DECISION_TYPES.RESOLVE_MINING_CHAIN,
            reason: 'Explore and mine for XP'
        }
    }

    decideWaterAction(bot, state) {
        console.log('[ExploreDecisionTree] Water detected ahead')

        if (this.canSwim(bot)) {
            return {
                type: DECISION_TYPES.SWIM,
                distance: 15
            }
        }

        const { hasBoat, hasMaterials } = checkBoatInventory(bot)

        if (hasBoat) {
            return {
                type: DECISION_TYPES.SWIM,
                distance: 15,
                useBoat: true
            }
        }

        if (hasMaterials) {
            return {
                type: DECISION_TYPES.CRAFT_BOAT
            }
        }

        if (hasAlternatePath(bot)) {
            return {
                type: DECISION_TYPES.DIG_FOR_XP,
                highPriorityOnly: false
            }
        }

        return {
            type: DECISION_TYPES.DIG_FOR_XP,
            highPriorityOnly: true
        }
    }

    decideLavaAction(bot, state) {
        console.log('[ExploreDecisionTree] Lava detected ahead')

        if (hasAlternatePath(bot)) {
            return {
                type: DECISION_TYPES.AVOID_LAVA,
                action: 'navigate'
            }
        }

        return {
            type: DECISION_TYPES.PLACE_BRIDGE,
            length: 5
        }
    }

    canSwim(bot) {
        return bot.health > 2
    }
}

module.exports = ExploreDecisionTree