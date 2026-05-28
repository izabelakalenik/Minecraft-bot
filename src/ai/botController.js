const DECISION_TYPES = require('./decisionTypes')

const fight = require('../actions/fight')
const flee = require('../actions/flee')
const exploreAndCollect = require("../actions/explore");
const buildShelter = require("../actions/buildShelter");
const {
    stayInShelter,
    continueSleeping,
} = require('../actions/passiveActions')
const followMe = require("../actions/followMe");
const leaveShelter = require("../actions/leaveShelter");
const sleep = require("../actions/sleep");

class BotController {
    constructor(bot, mcData) {
        this.bot = bot
        this.mcData = mcData
        this.isBusy = false

        this.actionMap = {
            [DECISION_TYPES.EXPLORE]: exploreAndCollect, // does nothing for now
            [DECISION_TYPES.FIGHT]: fight,
            [DECISION_TYPES.FLEE]: flee,
            [DECISION_TYPES.BUILD_SHELTER]: buildShelter,
            [DECISION_TYPES.STAY_IN_SHELTER]: stayInShelter,
            [DECISION_TYPES.LEAVE_SHELTER]: leaveShelter,
            [DECISION_TYPES.SLEEP]: sleep,
            [DECISION_TYPES.CONTINUE_SLEEPING]: continueSleeping,
        }
    }

    async execute(decision) {
        if (!decision) return
        if (this.isBusy) return

        const action = this.actionMap[decision.type]

        if (!action) {
            console.log(`[BotController] No action for ${decision.type}`)
            return
        }

        this.isBusy = true

        try {
            console.log(`[BotController] Execute ${decision.type}`)
            await action(this.bot, this.mcData, decision)
        } catch (err) {
            console.log(`[BotController] ${err.message}`)
        } finally {
            this.isBusy = false
        }
    }
}


module.exports = BotController