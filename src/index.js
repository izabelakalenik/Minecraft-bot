const DECISION_INTERVAL = 3_000 // 3 seconds

const followMe = require('./actions/followMe')

const createBot = require('./bot/createBot')
const setupPathfinder = require('./movement/pathfinder')
const botConfig = require('./bot/botConfig')

const WorldState = require("./bot/worldState");
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
        const mcData = setupPathfinder(bot)

        const worldState = new WorldState(bot)
        const decisionTree = new MainDecisionTree()

        const botController = new BotController(bot, mcData)
        const manualMode = new ManualModeController(bot)
        const commandController = new CommandController(
            bot,
            manualMode,
            worldState
        )

        setupChatCommands(bot, commandController)

        setInterval(async () => {
            if (manualMode.isEnabled()) return

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