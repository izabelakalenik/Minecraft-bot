class DecisionEngine {
    constructor(bot, mcData, actions, tasks) {
        this.bot = bot
        this.mcData = mcData
        this.actions = actions
        this.tasks = tasks
    }

    async run() {
        for (const task of this.tasks) {
            console.log(`\Task: ${task.type}`)

            const action = this.actions[task.type]

            if (!action) {
                console.log(`Unknown task: ${task.type} (skipping)`)
                continue
            }

            try {
                await action(this.bot, this.mcData, task)
                this.actions.printInventory(this.bot)
                console.log(`Task completed: ${task.type}`)
            } catch (err) {
                console.log(`Error during task ${task.type}: ${err.message}`)
            }
        }

        console.log('All tasks completed')
    }
}

module.exports = DecisionEngine