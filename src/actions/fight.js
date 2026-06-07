const moveTo = require('../movement/navigator')
const { equipBestWeapon } = require('./equipItem')

const ATTACK_RANGE = 3
const ATTACK_DELAY = 500
const LOW_HEALTH_LEVEL = 10
const MAX_FIGHT_TIME = 15000

async function fight(bot, decision) {
    const target = decision.target

    if (!target || !target.isValid) return

    console.log(`[Fight] Fighting ${target.name}`)

    const isPassivePrey = target.type === 'animal' || target.kind === 'Passive mobs'

    await equipBestWeapon(bot)

    const startTime = Date.now()

    while (target.isValid) {
        if (!isPassivePrey && bot.health <= LOW_HEALTH_LEVEL) {
            console.log('[Fight] Low health, stopping fight')
            return
        }

        if (Date.now() - startTime > MAX_FIGHT_TIME) {
            console.log('[Fight] Fight timeout')
            return
        }

        const distance = bot.entity.position.distanceTo(target.position)

        if (distance > ATTACK_RANGE) {
            await moveTo(bot, target.position, 15000, 2)
        }

        if (!target.isValid) break

        await bot.lookAt(target.position.offset(0, 1, 0))
        bot.attack(target)

        console.log('[Fight] Attacking')

        await sleep(ATTACK_DELAY)
    }

    console.log('[Fight] Target defeated')
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = fight