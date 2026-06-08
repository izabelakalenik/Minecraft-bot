const DECISION_TYPES = require('../decisionTypes')
const minecraftData = require('minecraft-data')
const { fluidAhead, fluidWidth, findBridgeBlock } = require('../../utils/terrain')

const WATER = ['water']
const DETECT_DISTANCE = 3
// water wider than this is crossed by boat instead of swimming
const SWIM_MAX_WIDTH = 20

class ExploreDecisionTree {
    decide(state) {
        // Basic safety checks
        if (!state || !state.bot) return null
        if (state.lowHealth || state.threat) return null

        const bot = state.bot

        if (bot._blockedRoute) {
            const { obstacle, target } = bot._blockedRoute
            bot._blockedRoute = null

            if (obstacle === 'water') {
                return {
                    type: DECISION_TYPES.CRAFT_BOAT,
                    target,
                    reason: 'Blocked by water toward target, crossing by boat'
                }
            }

            if (findBridgeBlock(bot)) {
                return {
                    type: DECISION_TYPES.BUILD_BRIDGE,
                    target,
                    length: 6,
                    reason: `Blocked by ${obstacle} toward target, building a bridge`
                }
            }
            // no blocks to bridge: fall through and explore elsewhere
        }


        const water = fluidAhead(bot, WATER, DETECT_DISTANCE)
        if (water && fluidWidth(bot, WATER) > SWIM_MAX_WIDTH) {
            return {
                type: DECISION_TYPES.CRAFT_BOAT,
                reason: 'Water too wide to swim, crossing by boat'
            }
        }

        const mcData = minecraftData(bot.version)

        const RESOURCES = [
            { name: 'coal', value: 1 },
            { name: 'iron', value: 3 }
        ]

        const maxDistance = 128
        let best = null

        for (const res of RESOURCES) {
            try {
                const pattern = `${res.name}_ore`
                const positions = bot.findBlocks({
                    matching: b => b && b.name && b.name.includes(pattern),
                    maxDistance,
                    count: 20
                })

                if (!positions || positions.length === 0) continue

                // find closest position
                let closestDist = Infinity
                for (const pos of positions) {
                    const block = bot.blockAt(pos)
                    if (!block) continue

                    const dist = bot.entity.position.distanceTo(block.position)
                    if (dist < closestDist) closestDist = dist
                }

                if (!isFinite(closestDist)) continue

                const score = res.value / (closestDist + 1)

                if (!best || score > best.score) {
                    best = {
                        resourceName: res.name,
                        distance: closestDist,
                        score
                    }
                }
            } catch (err) {
                // ignore search errors
            }
        }

        if (!best) return null

        return {
            type: DECISION_TYPES.EXPLORE,
            resourceName: best.resourceName,
            reason: `Prefer ${best.resourceName} (score=${best.score.toFixed(3)})`,
            distance: best.distance,
            amount: 4
        }
    }
}

module.exports = ExploreDecisionTree
