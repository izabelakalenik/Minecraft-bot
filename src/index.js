const createBot = require('./bot/createBot')
const setupPathfinder = require('./movement/pathfinder')
const DecisionEngine = require('./ai/decisionEngine')
const Planner = require('./ai/planner')
const botConfig = require('./config/botConfig')

const collectItem = require('./actions/collectItem')
const craftItem = require('./actions/craftItem')
const equipItem = require('./actions/equipItem')
const unequipItem = require('./actions/unequipItem')
const followMe = require('./actions/followMe')
const mineBlock = require('./actions/mineBlock')

const printInventory = require('./utils/inventory')

const actions = { collectItem, craftItem, equipItem, followMe, unequipItem, mineBlock, printInventory }

console.log('[Main] Creating bot...')
const bot = createBot(botConfig)

bot.on('login', () => {
    console.log('[Main] Bot logged in')
})

bot.once('spawn', () => {
    console.log('[Main] Bot spawned on server')
    
    try {
        const mcData = setupPathfinder(bot)
        console.log('[Main] Pathfinder initialized')
        
        const planner = new Planner(bot, mcData)
        const tasks = planner.generateTasks()

        const ai = new DecisionEngine(bot, mcData, actions, tasks)
        ai.run()
    } catch (err) {
        console.log(`[Main] Error initializing: ${err.message}`)
    }
})

bot.on('error', err => {
    console.log(`[Main] Bot error: ${err.message}`)
})

bot.on('end', () => {
    console.log('[Main] Bot disconnected')
})