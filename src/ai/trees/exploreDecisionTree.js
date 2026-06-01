const DECISION_TYPES = require('../decisionTypes')
const {
    ORE_TARGETS,
    RESOURCE_DEFS,
} = require('../../data/exploreData')
const {
    hasEnough,
} = require('../../utils/inventory')
const {
    findNearestBlock,
    findCraftingTable,
    findFurnace,
} = require('../../utils/world')
const {
    getItemDef,
    getRecipeCandidates,
    recipeRequiresCraftingTable,
    getFirstMissingIngredientName,
    getRawSmeltTarget,
} = require('../../utils/recipe')

class ExploreDecisionTree {
    constructor(options = {}) {
        this.oreTargets = options.oreTargets || ORE_TARGETS
        this.resourceDefs = options.resourceDefs || RESOURCE_DEFS
        this.maxDepth = options.maxDepth || 16
    }

    decide(state) {
        const bot = state?.bot
        if (!bot) return null

        const target = this._pickOreTarget(bot, state)
        if (!target) {
            return {
                type: DECISION_TYPES.EXPLORE_IDLE,
                reason: 'No valid ore target found',
            }
        }

        if (!hasEnough(bot, target.requiredTool, 1)) {
            const next = this._nextStepToObtainItem(bot, target.requiredTool, state, new Set(), 0)
            if (next) return next
        }

        const oreBlock = findNearestBlock(bot, target.blocks, state?.exploreSearchRadius || 64)
        if (!oreBlock) {
            return {
                type: DECISION_TYPES.EXPLORE_SEARCH,
                targetOre: target.name,
                reason: `No ${target.name} visible yet; keep exploring`,
            }
        }

        return {
            type: DECISION_TYPES.EXPLORE_MINE,
            blockName: oreBlock.name,
            targetItemName: target.name,
            requiredTool: target.requiredTool,
            amount: 1,
            reason: `Mine ${oreBlock.name} for XP`,
        }
    }

    _pickOreTarget(bot, state) {
        const forced = state?.exploreTargetOre
        if (forced) {
            const direct = this.oreTargets.find(t => t.name === forced || t.blocks.includes(forced))
            if (direct) return direct
        }

        const visible = []
        for (const target of this.oreTargets) {
            const block = findNearestBlock(bot, target.blocks, state?.exploreSearchRadius || 64)
            if (block) {
                visible.push({ target, block })
            }
        }

        if (visible.length > 0) {
            visible.sort((a, b) => b.target.xpPriority - a.target.xpPriority)
            return visible[0].target
        }

        return this.oreTargets[0] || null
    }

    _nextStepToObtainItem(bot, itemName, state, visited, depth) {
        if (depth > this.maxDepth) {
            return {
                type: DECISION_TYPES.EXPLORE_STUCK,
                itemName,
                reason: `Max recursion depth reached while trying to obtain ${itemName}`,
            }
        }

        if (visited.has(itemName)) {
            return {
                type: DECISION_TYPES.EXPLORE_STUCK,
                itemName,
                reason: `Recursive loop detected while trying to obtain ${itemName}`,
            }
        }

        visited.add(itemName)

        if (hasEnough(bot, itemName, 1)) {
            return null
        }

        const smeltTarget = getRawSmeltTarget(bot, itemName)
        if (smeltTarget) {
            return this._resolveSmeltStep(bot, smeltTarget, state, visited, depth)
        }

        const gather = this._resolveGatherable(itemName)
        if (gather) {
            if (gather.preferredTool && !hasEnough(bot, gather.preferredTool, 1)) {
                return this._nextStepToObtainItem(bot, gather.preferredTool, state, visited, depth + 1)
            }

            const sourceBlock = findNearestBlock(bot, gather.blocks, state?.exploreSearchRadius || 64)
            if (!sourceBlock) {
                return {
                    type: DECISION_TYPES.EXPLORE_SEARCH,
                    targetResource: itemName,
                    reason: `Need ${itemName}; searching for source blocks`,
                }
            }

            return {
                type: DECISION_TYPES.EXPLORE_MINE,
                blockName: sourceBlock.name,
                targetItemName: itemName,
                amount: 1,
                requiredTool: gather.preferredTool || null,
                reason: `Gather ${itemName}`,
            }
        }

        const tableNearby = findCraftingTable(bot)

        if (itemName !== 'crafting_table' && !tableNearby && !hasEnough(bot, 'crafting_table', 1)) {
            return this._nextStepToObtainItem(bot, 'crafting_table', state, visited, depth + 1)
        }

        const itemDef = getItemDef(bot, itemName)
        if (!itemDef) {
            return {
                type: DECISION_TYPES.EXPLORE_STUCK,
                itemName,
                reason: `No recipe or gather rule found for ${itemName}`,
            }
        }

        const recipes = getRecipeCandidates(bot, itemName, tableNearby)
        if (!recipes.length) {
            if (itemName !== 'crafting_table' && !tableNearby && !hasEnough(bot, 'crafting_table', 1)) {
                return this._nextStepToObtainItem(bot, 'crafting_table', state, visited, depth + 1)
            }

            return {
                type: DECISION_TYPES.EXPLORE_STUCK,
                itemName,
                reason: `No recipe found for ${itemName}`,
            }
        }

        for (const recipe of recipes) {
            const next = this._resolveRecipeStep(bot, itemName, recipe, tableNearby, state, visited, depth)
            if (next) return next
        }

        return {
            type: DECISION_TYPES.EXPLORE_STUCK,
            itemName,
            reason: `Could not resolve recipe chain for ${itemName}`,
        }
    }

    _resolveSmeltStep(bot, smeltTarget, state, visited, depth) {
        const { inputItemName, outputItemName } = smeltTarget

        if (!hasEnough(bot, inputItemName, 1)) {
            return this._nextStepToObtainItem(bot, inputItemName, state, visited, depth + 1)
        }

        if (!hasEnough(bot, 'furnace', 1)) {
            return this._nextStepToObtainItem(bot, 'furnace', state, visited, depth + 1)
        }

        const furnaceNearby = findFurnace(bot)
        if (!furnaceNearby) {
            return {
                type: DECISION_TYPES.EXPLORE_PLACE_FURNACE,
                name: 'furnace',
                reason: 'Place furnace before smelting',
            }
        }

        return {
            type: DECISION_TYPES.EXPLORE_SMELT,
            inputItemName,
            outputItemName,
            amount: 1,
            reason: `Smelt ${inputItemName} into ${outputItemName}`,
        }
    }

    _resolveRecipeStep(bot, itemName, recipe, tableNearby, state, visited, depth) {
        const missingIngredient = getFirstMissingIngredientName(bot, recipe)
        if (missingIngredient) {
            return this._nextStepToObtainItem(bot, missingIngredient, state, visited, depth + 1)
        }

        if (recipeRequiresCraftingTable(recipe) && !tableNearby) {
            if (!hasEnough(bot, 'crafting_table', 1)) {
                return this._nextStepToObtainItem(bot, 'crafting_table', state, visited, depth + 1)
            }

            return {
                type: DECISION_TYPES.EXPLORE_PLACE_CRAFTING_TABLE,
                name: 'crafting_table',
                reason: 'Place crafting table before crafting this item',
            }
        }

        return {
            type: DECISION_TYPES.EXPLORE_CRAFT,
            itemName,
            amount: 1,
            requiresTable: recipeRequiresCraftingTable(recipe),
            reason: `Craft ${itemName}`,
        }
    }

    _resolveGatherable(itemName) {
        if (itemName === 'logs') {
            return this.resourceDefs.logs
        }

        if (itemName === 'cobblestone') {
            return this.resourceDefs.cobblestone
        }

        return null
    }
}

module.exports = ExploreDecisionTree