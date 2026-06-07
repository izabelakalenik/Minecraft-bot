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
        // priority = tree index (lower = more important)
        for (let i = 0; i < this.trees.length; i++) {
            const decision = this.trees[i].decide(state)

            if (decision) {
                decision.priority = i
                return decision
            }
        }

        return { type: DECISION_TYPES.EXPLORE, priority: this.trees.length - 1 }
    }
}

module.exports = MainDecisionTree