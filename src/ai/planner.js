class Planner {
    constructor(bot, mcData) {
        this.bot = bot
        this.mcData = mcData
    }

    generateTasks() {
        const tasks = []

        // This is a task plan for a bot, 
        // every item name should be checked to ensure it exists in the world or is available in the bot area.
        // Names should be checked every time before the task is added to the plan, so the bot can adapt to the current situation.
        const taskPlan = [
            { type: 'collectItem', blockName: 'oak_log', amount: 10 },
            { type: 'collectItem', blockName: 'dirt', amount: 10 },
            { type: 'unequipItem', slot: 'hand' },
            { type: 'followMe', username: 'im_dizzy' },
            { type: 'craftItem', recipe: 'oak_planks', amount: 2 },
            { type: 'craftItem', recipe: 'stick', amount: 1 },
            { type: 'equipItem', item: 'stick' },
            { type: 'craftItem', recipe: 'crafting_table', amount: 1 }
        ]

        for (const plannedTask of taskPlan) {
            if (plannedTask.type === 'collectItem') {
                const itemData = this.mcData.itemsByName[plannedTask.blockName]
                if (!itemData) {
                    console.log(`[Planner] Unknown collect target: ${plannedTask.blockName}`)
                    continue
                }

                const currentAmount = this.bot.inventory.count(itemData.id)
                if (currentAmount < plannedTask.amount) {
                    tasks.push({ ...plannedTask })
                } else {
                    console.log(`[Planner] Skipping ${plannedTask.blockName}, already have ${currentAmount}`)
                }
                continue
            }

            if (plannedTask.type === 'craftItem') {
                const recipeItem = this.mcData.itemsByName[plannedTask.recipe]
                if (!recipeItem) {
                    console.log(`[Planner] Unknown craft recipe item: ${plannedTask.recipe}`)
                    continue
                }
                tasks.push({ ...plannedTask })
                continue
            }

            if (plannedTask.type === 'equipItem' || plannedTask.type === 'unequipItem' || plannedTask.type === 'followMe') {
                tasks.push({ ...plannedTask })
                continue
            }

            console.log(`[Planner] Unsupported task type: ${plannedTask.type}`)
        }

        return tasks
    }
}

module.exports = Planner