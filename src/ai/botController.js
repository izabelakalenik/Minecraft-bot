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
const craftFurnace = require("../actions/craftFurnace");
const craftFood = require("../actions/craftFood");
const explore = require('../actions/explore')

class BotController {
    constructor(bot) {
        this.bot = bot
        this.isBusy = false

        this.actionMap = {
            [DECISION_TYPES.FIGHT]: fight,
            [DECISION_TYPES.FLEE]: flee,
            [DECISION_TYPES.BUILD_SHELTER]: buildShelter,
            [DECISION_TYPES.STAY_IN_SHELTER]: stayInShelter,
            [DECISION_TYPES.LEAVE_SHELTER]: leaveShelter,
            [DECISION_TYPES.SLEEP]: sleep,
            [DECISION_TYPES.CONTINUE_SLEEPING]: continueSleeping,
            [DECISION_TYPES.PLACE_BED]: placeItem,
            [DECISION_TYPES.EAT_FOOD]: eatFood,
            [DECISION_TYPES.FIND_FOOD]: findFood,
            [DECISION_TYPES.COOK_MEAT]: cookMeat,
            [DECISION_TYPES.CRAFT_FURNACE]: craftFurnace,
            [DECISION_TYPES.CRAFT_FOOD]: craftFood,
            [DECISION_TYPES.EXPLORE]: explore,
            // add craft bed
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
        this.bot._aiActionActive = true

        try {
            console.log(`[BotController] Execute ${decision.type}`)
            await action(this.bot, decision)
        } catch (err) {
            // Fallbacks
            console.log(`[BotController] ${err.message}`)

            if (decision.type === DECISION_TYPES.PLACE_BED) {
                console.log(
                    '[BotController] Fallback: Cannot place bed, building shelter'
                )
                await buildShelter(this.bot)
            }
        } finally {
            this.isBusy = false
            this.bot._aiActionActive = false
        }
    }
}


module.exports = BotController