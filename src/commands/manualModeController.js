class ManualModeController {
    constructor(bot) {
        this.bot = bot
        this.enabled = false
    }

    async enable() {
        this.enabled = true
        console.log('[ManualMode] Enabled')
    }

    disable() {
        this.enabled = false

        if (this.bot.pathfinder) {
            this.bot.pathfinder.setGoal(null)
        }

        this.bot.clearControlStates()

        console.log('[ManualMode] Disabled')
    }

    isEnabled() {
        return this.enabled
    }
}

module.exports = ManualModeController