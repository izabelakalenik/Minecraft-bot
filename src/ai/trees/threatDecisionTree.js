const DECISION_TYPES = require('../decisionTypes')

class ThreatDecisionTree {
    decide(state) {
        if (!state.threat) return null

        if (state.isSheltered){
            return {
                type: DECISION_TYPES.STAY_IN_SHELTER,
                target: state.threat,
                reason: 'Threat nearby but bot is safe in shelter',
            }
        }

        if (state.lowHealth) {
            return {
                type: DECISION_TYPES.FLEE,
                target: state.threat,
                reason: 'Low health and threat nearby'
            }
        }

        if (state.threatIsClose) {
            return {
                type: DECISION_TYPES.FIGHT,
                target: state.threat,
                reason: 'Threat is close enough to fight'
            }
        }

        return {
            type: DECISION_TYPES.FLEE,
            target: state.threat,
            reason: 'Threat detected but not close, keep distance'
        }
    }
}

module.exports = ThreatDecisionTree