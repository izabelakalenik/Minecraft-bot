const DECISION_INTERVAL = 3_000 // 3 seconds

const createBot = require('./bot/createBot')
const setupPathfinder = require('./movement/pathfinder')
const botConfig = require('./bot/botConfig')

const WorldState = require("./states/worldState");
const MainDecisionTree = require("./ai/trees/mainDecisionTree");
const BotController = require("./ai/botController");
const ManualModeController = require("./commands/manualModeController");
const CommandController = require("./commands/commandController");
const setupChatCommands = require("./commands/setupChatCommands");


console.log('[Main] Creating bot...')
const bot = createBot(botConfig)

bot.on('login', () => {
    console.log('[Main] Bot logged in')
})

bot.once('spawn', () => {
    console.log('[Main] Bot spawned on server')

    try {
        setupPathfinder(bot)

        const worldState = new WorldState(bot)
        const decisionTree = new MainDecisionTree()

        const botController = new BotController(bot)
        const manualModeController = new ManualModeController(bot)
        const commandController = new CommandController(
            bot,
            manualModeController,
            worldState
        )

        setupChatCommands(bot, commandController)

        setInterval(async () => {
            if (manualModeController.isEnabled()) return

            worldState.update()
            worldState.printState()

            const decision = decisionTree.decide(worldState)

            console.log('[Main] Decided on:', decision)

            await botController.execute(decision)
        }, DECISION_INTERVAL)

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