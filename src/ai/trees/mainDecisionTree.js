const ThreatDecisionTree = require('./threatDecisionTree')
const NightDecisionTree = require('./nightDecisionTree')
const HungerDecisionTree = require('./hungerDecisionTree')
const ExploreDecisionTree = require('./exploreDecisionTree')
const DECISION_TYPES = require('../decisionTypes')

class MainDecisionTree {
    constructor() {
        this.trees = [
            new ThreatDecisionTree(),
            new NightDecisionTree(),
            new HungerDecisionTree(),
            new ExploreDecisionTree(),
        ]
    }

    decide(state) {
        for (const tree of this.trees) {
            const decision = tree.decide(state)

            if (decision) {
                return decision
            }
        }

        return { type: DECISION_TYPES.EXPLORE}
    }
}

module.exports = MainDecisionTree