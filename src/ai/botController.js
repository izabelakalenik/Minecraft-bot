const DECISION_TYPES = require('./decisionTypes')

const fight = require('../actions/fight')
const flee = require('../actions/flee')
const buildShelter = require("../actions/buildShelter");
const {
    stayInShelter,
    continueSleeping,
} = require('../actions/passiveActions')
const leaveShelter = require("../actions/leaveShelter");
const sleep = require("../actions/sleep");
const placeItem = require("../actions/placeItem");
const eatFood = require("../actions/eatFood");
const findFood = require("../actions/findFood");
const cookMeat = require("../actions/cookMeat");
const craftItem = require("../actions/craftItem");
const explore = require('../actions/explore')
const buildBridge = require('../actions/buildBridge')

class BotController {
    constructor(bot) {
        this.bot = bot
        this.isBusy = false
        this.currentPriority = Infinity

        this.actionMap = {
            [DECISION_TYPES.FIGHT]: fight,
            [DECISION_TYPES.FLEE]: flee,
            [DECISION_TYPES.BUILD_SHELTER]: buildShelter,
            [DECISION_TYPES.STAY_IN_SHELTER]: stayInShelter,
            [DECISION_TYPES.LEAVE_SHELTER]: leaveShelter,
            [DECISION_TYPES.SLEEP]: sleep,
            [DECISION_TYPES.CONTINUE_SLEEPING]: continueSleeping,
            [DECISION_TYPES.CRAFT_BED]: (bot, decision) => craftItem(bot, decision.item, decision.amount || 1),
            [DECISION_TYPES.PLACE_BED]: placeItem,
            [DECISION_TYPES.EAT_FOOD]: eatFood,
            [DECISION_TYPES.FIND_FOOD]: findFood,
            [DECISION_TYPES.COOK_MEAT]: cookMeat,
            [DECISION_TYPES.CRAFT_FURNACE]: (bot, decision) => craftItem(bot, decision.item, decision.amount || 1),
            [DECISION_TYPES.PLACE_FURNACE]: placeItem,
            [DECISION_TYPES.CRAFT_FOOD]: (bot, decision) => craftItem(bot, decision.food, decision.amount || 1),
            [DECISION_TYPES.BUILD_BRIDGE]: buildBridge,
            [DECISION_TYPES.EXPLORE]: explore,
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
        this.currentPriority = decision.priority ?? Infinity
        this.bot._aiActionActive = true
        this.bot._aiAbort = false

        try {
            console.log(`[BotController] Execute ${decision.type}`)
            await action(this.bot, decision)
        } catch (err) {
            // fallbacks
            console.log(`[BotController] ${err.message}`)

            if (decision.type === DECISION_TYPES.PLACE_BED) {
                console.log(
                    '[BotController] Fallback: Cannot place bed, building shelter'
                )
                await buildShelter(this.bot)
            }
        } finally {
            this.isBusy = false
            this.currentPriority = Infinity
            this.bot._aiActionActive = false
            this.bot._aiAbort = false
        }
    }

    // interrupt the running action when a higher-priority decision appears
    maybePreempt(decision) {
        if (!this.isBusy || !decision) return

        const newPriority = decision.priority ?? Infinity
        if (newPriority < this.currentPriority) {
            console.log(`[BotController] Action ${decision.type} has higher priority (${newPriority}) than current action (${this.currentPriority})`)
            this.bot._aiAbort = true
            this.bot.emit('forceStop')
        }
    }
}


module.exports = BotController