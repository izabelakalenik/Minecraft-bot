const followMe = require('../actions/followMe')
const printInventory = require('../utils/inventory')
const getInventory = require("../utils/inventory");

class CommandController {
    constructor(bot, manualMode, worldState) {
        this.bot = bot
        this.manualMode = manualMode
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
    }

    async follow(username) {
        const player = this.bot.players[username]?.entity

        if (!player) {
            this.bot.chat(`I can't see you`)
            return
        }

        this.manualMode.enable()

        this.bot.chat('Manual mode started: following you')
        console.log(`[Command] Following ${username}`)

        await followMe(this.bot, player)
    }

    manual(){
        this.manualMode.enable()

        this.bot.chat('Manual mode started. Stopping AI tasks.')
        console.log('[Command] Manual mode started. Stopping AI tasks.')
    }

    auto() {
        this.manualMode.disable()

        this.bot.chat('Manual mode stopped. Resuming AI tasks.')
        console.log('[Command] Manual mode stopped. Resuming AI tasks.')
    }

    status() {
        this.worldState.update()

        const threat =
            this.worldState.threat?.name || 'none'

        const message =
            `HP: ${this.worldState.health} | ` +
            `Food: ${this.worldState.food} | ` +
            `Night: ${this.worldState.isNight} | ` +
            `Threat: ${threat} | ` +
            `Sheltered: ${this.worldState.isSheltered}` +
            `Sleeping: ${this.worldState.isSleeping}`

        this.bot.chat(message)
    }

    inventory() {
        const inventoryString =
            getInventory(this.bot)

        console.log('[Command] ', inventoryString)
        this.bot.chat(inventoryString)
    }
}

module.exports = CommandController