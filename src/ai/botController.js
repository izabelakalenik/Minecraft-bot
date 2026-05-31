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
const digForXp = require("../actions/digForXp");
const swimMove = require("../actions/swimMove");
const craftBoat = require("../actions/craftBoat");
const buildBridge = require("../actions/buildBridge");
const craftCraftingTable = require("../actions/craftCraftingTable");
const resolveMiningChain = require("../actions/resolveMiningChain");

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
            [DECISION_TYPES.DIG_FOR_XP]: digForXp,
            [DECISION_TYPES.RESOLVE_MINING_CHAIN]: resolveMiningChain,
            [DECISION_TYPES.SWIM]: swimMove,
            [DECISION_TYPES.CRAFT_BOAT]: craftBoat,
            [DECISION_TYPES.PLACE_BRIDGE]: buildBridge,
            [DECISION_TYPES.AVOID_LAVA]: this.avoidLava,
            [DECISION_TYPES.CRAFT_CRAFTING_TABLE]: craftCraftingTable,
            [DECISION_TYPES.CRAFT_PICKAXE]: this.craftPickaxe,
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
            
            // Handle bound methods vs regular functions
            if (typeof action === 'function' && (action.name === 'avoidLava' || action.name === 'craftPickaxe')) {
                await action.call(this, this.bot, decision)
            } else {
                await action(this.bot, decision)
            }
        } catch (err) {
            // Fallbacks
            console.log(`[BotController] ${err.message}`)

            if (decision.type === DECISION_TYPES.PLACE_BED) {
                console.log(
                    '[BotController] Fallback: Cannot place bed, building shelter'
                )
                await buildShelter(this.bot)
            }
            
            if (decision.type === DECISION_TYPES.CRAFT_PICKAXE) {
                console.log(
                    '[BotController] Fallback: Cannot craft pickaxe, placing crafting table'
                )
                await craftCraftingTable(this.bot)
            }
        } finally {
            this.isBusy = false
        }
    }

    async avoidLava(bot, decision) {
        console.log('[BotController] Avoiding lava by navigating around')
        // Simple avoid - just move sideways or backward
        const x = bot.entity.position.x + (Math.random() * 10 - 5)
        const z = bot.entity.position.z + (Math.random() * 10 - 5)
        
        const moveTo = require('../movement/navigator')
        try {
            await moveTo(bot, { x, y: bot.entity.position.y, z }, 15000, 2)
            console.log('[BotController] Moved away from lava')
        } catch (err) {
            console.log(`[BotController] Failed to avoid lava: ${err.message}`)
        }
    }

    async craftPickaxe(bot, decision) {
        console.log('[BotController] Crafting pickaxe')
        bot.chat('Crafting pickaxe...')
        
        try {
            const mcData = bot.registry
            const toolLevel = decision.toolLevel || 'wooden'
            
            let pickaxeName = 'wooden_pickaxe'
            if (toolLevel === 'stone') {
                pickaxeName = 'stone_pickaxe'
            } else if (toolLevel === 'iron') {
                pickaxeName = 'iron_pickaxe'
            }
            
            const pickaxeId = mcData.itemsByName[pickaxeName]?.id
            if (!pickaxeId) {
                throw new Error(`Pickaxe ${pickaxeName} not found in registry`)
            }
            
            const recipes = bot.recipesFor(pickaxeId, null, 1, null)
            if (!recipes || recipes.length === 0) {
                throw new Error(`No recipe for ${pickaxeName}`)
            }
            
            await bot.craft(recipes[0], 1, null)
            console.log(`[BotController] Pickaxe crafted: ${pickaxeName}`)
        } catch (err) {
            console.log(`[BotController] Error crafting pickaxe: ${err.message}`)
            throw err
        }
    }
}


module.exports = BotController