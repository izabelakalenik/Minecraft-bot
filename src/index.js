const createBot = require('./bot/createBot')
const setupPathfinder = require('./movement/pathfinder')

const collectWood = require('./actions/collectItem')
const craftWoodenAxe = require('./actions/craftItem')

const printInventory = require('./utils/inventory')
const DecisionEngine = require('./ai/decisionEngine')

const bot = createBot()

bot.once('spawn', async () => {
    console.log('Bot jest z nami')

    const mcData = setupPathfinder(bot)

    const ai = new DecisionEngine(
        bot,
        mcData,
        collectWood,
        craftWoodenAxe,
        printInventory
    )

    await ai.run()
})