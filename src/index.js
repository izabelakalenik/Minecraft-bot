const createBot = require('./bot/createBot')
const setupPathfinder = require('./movement/pathfinder')

const DecisionEngine = require('./ai/decisionEngine')

const bot = createBot()

const collectItem = require('./actions/collectItem')
const craftItem = require('./actions/craftItem')
const equipItem = require('./actions/equipItem')
const unequipItem = require('./actions/unequipItem')
const followMe = require('./actions/followMe')

const printInventory = require('./utils/inventory')

const actions = {collectItem, craftItem, printInventory, equipItem, followMe, unequipItem}

tasks = [
    { type: "collectItem", "blockName": "oak_log", "amount": 10},
    // { type: "unequipItem", slot: "hand" },
    // { type: "followMe", username: "gosia" },
    // { type: "craftItem", recipe: "oak_planks", amount: 2 },
    // { type: "craftItem", recipe: "stick", amount: 1 },
    // { type: "equipItem", item: "stick" },
    // { type: "craftItem", recipe: "crafting_table", amount: 1 },
]

bot.once('spawn', () => {
    console.log('Bot jest z nami')

    const mcData = setupPathfinder(bot)

    const ai = new DecisionEngine(
        bot,
        mcData,
        actions,
        tasks
    )

     ai.run()
})