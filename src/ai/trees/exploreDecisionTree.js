const DECISION_TYPES = require('../decisionTypes')
const minecraftData = require('minecraft-data')
const { fluidAhead, fluidWidth, hasAlternateRoute } = require('../../utils/terrain')

const WATER = ['water']
const LAVA = ['lava']
const DETECT_DISTANCE = 3
// water wider than this is crossed by boat instead of swimming
const SWIM_MAX_WIDTH = 20

class ExploreDecisionTree {
    decide(state) {
        // Basic safety checks
        if (!state || !state.bot) return null
        if (state.lowHealth || state.threat) return null

        const bot = state.bot

        // normal swimming and routing around lava are handled by the pathfinder during navigation;
        // here we only cover the two cases it can't: wide water (boat) and lava with no detour (bridge)
        const water = fluidAhead(bot, WATER, DETECT_DISTANCE)
        if (water && fluidWidth(bot, WATER) > SWIM_MAX_WIDTH) {
            return {
                type: DECISION_TYPES.CRAFT_BOAT,
                reason: 'Water too wide to swim, crossing by boat'
            }
        }

        const lava = fluidAhead(bot, LAVA, DETECT_DISTANCE)
        if (lava && !hasAlternateRoute(bot)) {
            return {
                type: DECISION_TYPES.BUILD_BRIDGE,
                hazard: lava,
                length: 5,
                reason: 'Lava ahead with no detour, bridging across'
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
