const followMe = require('../actions/followMe')
const printInventory = require('../utils/inventory')
const getInventory = require("../utils/inventory");
const leaveShelter = require("../actions/leaveShelter");
const tossItem = require("../actions/tossItem");
const placeItem = require("../actions/placeItem");
const eatFood = require("../actions/eatFood");
const craftItem = require('../actions/craftItem')
const digResource = require('../actions/digResource')
class CommandController {
    constructor(bot, manualModeController, worldState) {
        this.bot = bot
        this.manualModeController = manualModeController
        this.worldState = worldState
    }

    async handle(username, message) {
        // mode + read-only commands work in any mode
        if (message === 'manual') {
            return this.manual()
        }

        if (message === 'auto') {
            return this.auto()
        }

        if (message === 'status') {
            return this.status()
        }

        if (message === 'inventory') {
            return this.inventory()
        }

        // everything below acts on the bot and requires manual mode first
        if (!this.manualModeController.isEnabled()) {
            this.bot.chat('Set the bot to manual mode first (type "manual")')
            console.log('[Command] Rejected - bot is not in manual mode')
            return
        }

        if (message === 'follow me') {
            return this.follow(username)
        }

        if (message.startsWith('toss ')) {
            return this.toss(message)
        }

        if (message.startsWith('place ')) {
            return this.place(message)
        }

        if (message === 'eat') {
            return this.eat()
        }

        if (message.startsWith('craft ')) {
            return this.craft(message)
        }

        if (message.startsWith('dig ')) {
            return this.dig(message)
        }
    }

    async follow(username) {
        const player = this.bot.players[username]?.entity

        if (!player) {
            this.bot.chat(`I can't see you`)
            return
        }
        this.bot.chat(`Following ${username}`)
        console.log(`[Command] Following ${username}`)

        await followMe(this.bot, username)
    }

    async manual(){
        if (this.manualModeController.enabled) return

        this.manualModeController.enable()

        this.bot.chat('Manual mode started. Stopping AI tasks.')
        console.log('[Command] Manual mode started. Stopping AI tasks.')

        this.worldState.update()
        if (this.worldState.isSleeping) {
            console.log('[Command] Bot is sleeping, waking up')
            await this.bot.wake()
        }
        if (this.worldState.isSheltered){
            console.log('[Command] Bot is leaving shelter.')
            await leaveShelter(this.bot, null, null)
        }
    }

     auto() {
        this.manualModeController.disable()

        this.bot.chat('Manual mode stopped. Resuming AI tasks.')
        console.log('[Command] Manual mode stopped. Resuming AI tasks.')
    }

    status() {
        this.worldState.update()

        const state = this.worldState.getPrintableState()

        const message =
            `Mode: ${this.manualModeController.enabled ? 'Manual' : 'Auto'} | ` +
            `HP: ${Number(state.health).toFixed(1)}/20 | ` +
            `Food: ${Number(state.food).toFixed(1)}/20 | ` +
            `Night: ${state.isNight} | ` +
            `Threat: ${state.threat ?? 'none'} | ` +
            `Sheltered: ${state.isSheltered} | ` +
            `Sleeping: ${state.isSleeping} | ` +
            `BestFood: ${state.bestFood ?? 'none'} | `

        this.bot.chat(message)
    }

    inventory() {
        const inventoryString =
            getInventory(this.bot)

        console.log('[Command] ', inventoryString)
        this.bot.chat(inventoryString)
    }

    async toss(message) {
        const parts = message.split(' ')
        const itemName = parts[1]
        const amount = parts[2] ? Number(parts[2]) : 1

        if (!itemName) {
            this.bot.chat('Usage: toss item_name [amount]')
            return
        }

        await tossItem(this.bot, {
            name: itemName,
            amount
        })

        console.log(`[Command] Toss ${amount} x ${itemName}`)
        this.bot.chat(`Tossed ${amount} x ${itemName}`)
    }

    async place(message) {
        const parts = message.split(' ')
        const itemName = parts[1]
        const amount = parts[2] ? Number(parts[2]) : 1

        if (!itemName) {
            return
        }
        for (let i = 0; i < amount; i++) {
            await placeItem(this.bot, {
                name: itemName,
                amount
            })
        }

        console.log(`[Command] Placed ${amount} x ${itemName}`)
        this.bot.chat(`Placed ${amount} x ${itemName}`)
    }

    async eat() {
        this.worldState.update()
        const food = this.worldState.bestFood

        if (!food) {
            this.bot.chat('[Command] No food available')
            return
        }

        console.log(
            `[Command] Eat ${food.name}`
        )

        await eatFood(this.bot, {
            food: food,
            reason: 'Manual command'
        })
    }

    async craft(message) {
        const parts = message.split(' ')
        const itemName = parts[1]
        const amount = parts[2] ? Number(parts[2]) : 1

        if (!itemName) {
            this.bot.chat('Usage: craft item_name [amount]')
            return
        }

        try {
            console.log(`[Command] Craft ${amount} x ${itemName}`)
            this.bot.chat(`Crafting ${amount} x ${itemName}`)
            await craftItem(this.bot, itemName, amount)
            this.bot.chat(`Crafted ${amount} x ${itemName}`)
        } catch (err) {
            console.log(`[Command] Craft failed: ${err.message}`)
            this.bot.chat(`Craft failed: ${err.message}`)
        }
    }

    async dig(message) {
        const parts = message.split(' ')
        const itemName = parts[1]
        const amount = parts[2] ? Number(parts[2]) : 1

        if (!itemName) {
            this.bot.chat('Usage: dig resource_name [amount]')
            return
        }

        try {
            console.log(`[Command] Dig ${amount} x ${itemName}`)
            this.bot.chat(`Digging ${amount} x ${itemName}`)

            await digResource(this.bot, itemName, amount)

            this.bot.chat(`Dug ${amount} x ${itemName}`)
        } catch (err) {
            console.log(`[Command] Dig failed: ${err.message}`)
            this.bot.chat(`Dig failed: ${err.message}`)
        }
    }
}

module.exports = CommandController