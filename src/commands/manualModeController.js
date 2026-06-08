class ManualModeController {
    constructor(bot) {
        this.bot = bot
        this.enabled = false
    }

    async enable() {
        this.enabled = true

        // stop every running task: abort in-flight navigation, drop the pathfinder
        // goal, release movement keys, and cancel any active digging
        this.bot.emit('forceStop')

        if (this.bot.pathfinder) {
            this.bot.pathfinder.setGoal(null)
        }

        this.bot.clearControlStates()

        try {
            this.bot.stopDigging()
        } catch (err) {
            // not digging - nothing to stop
        }

        console.log('[ManualMode] Enabled - all tasks stopped')
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