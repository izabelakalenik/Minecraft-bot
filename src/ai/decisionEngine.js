class DecisionEngine {
    constructor(bot, mcData, actions, tasks) {
        this.bot = bot
        this.mcData = mcData
        this.actions = actions
        this.tasks = tasks
    }

    async run() {
        for (const task of this.tasks) {
            console.log(`\nZadanie: ${task.type}`)

            const action = this.actions[task.type]

            if (!action) {
                console.log(`Nieznane zadanie: ${task.type} (pomijam)`)
                continue
            }

            try {
                await action(this.bot, this.mcData, task)
                this.actions.printInventory(this.bot)
                console.log(`✔ Wykonano zadanie: ${task.type}`)
            } catch (err) {
                console.log(`Błąd podczas zadania: ${task.type}, error message: ${err.message}`)
            }
        }

        console.log('🎉 Wszystkie zadania wykonane')
    }
}

module.exports = DecisionEngine