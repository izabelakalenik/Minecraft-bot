class DecisionEngine {
    constructor(bot, mcData, actions, tasks = []) {
        this.bot = bot
        this.mcData = mcData
        this.actions = actions
        this.tasks = tasks
    }

    async run() {
        if (!Array.isArray(this.tasks) || this.tasks.length === 0) {
            console.log('[DecisionEngine] No tasks available')
            return
        }

        console.log(`[DecisionEngine] Starting with ${this.tasks.length} task(s)`)

        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i]
            console.log(`[DecisionEngine] Task ${i + 1}/${this.tasks.length}: ${task.type}`)
            
            const action = this.actions[task.type]

            if (!action) {
                console.log(`[DecisionEngine] Unknown task: ${task.type}, skipping`)
                continue
            }

            try {
                await action(this.bot, this.mcData, task)
                if (typeof this.actions.printInventory === 'function') {
                    this.actions.printInventory(this.bot)
                }
                console.log(`[DecisionEngine] Task completed: ${task.type}`)
            } catch (err) {
                console.log(`[DecisionEngine] Error during task ${task.type}: ${err.message}`)
            }
        }

        console.log('[DecisionEngine] All tasks completed')
    }
}

module.exports = DecisionEngine