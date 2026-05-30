const followMe = require('../actions/followMe')
const printInventory = require('../utils/inventory')
const getInventory = require("../utils/inventory");
const leaveShelter = require("../actions/leaveShelter");
const tossItem = require("../actions/tossItem");
const placeItem = require("../actions/placeItem");
const eatFood = require("../actions/eatFood");

class CommandController {
    constructor(bot, manualModeController, worldState) {
        this.bot = bot
        this.manualModeController = manualModeController
        this.worldState = worldState
    }

    async handle(username, message) {
        if (message === 'follow me') {
            return this.follow(username)
        }

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

        if (message.startsWith('toss ')) {
            return this.toss(message)
        }

        if (message.startsWith('place ')) {
            return this.place(message)
        }

        if (message === 'eat') {
            return this.eat()
        }
    }

    async follow(username) {
        const player = this.bot.players[username]?.entity

        if (!player) {
            this.bot.chat(`I can't see you`)
            return
        }
        await this.manual()
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
            `HP: ${state.health} | ` +
            `Food: ${state.food} | ` +
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
        await this.manual()

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
        await this.manual()

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
        await this.manual()

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
}

module.exports = CommandController