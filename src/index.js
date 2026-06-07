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

        // NaN recovery. Root cause: a NaN yaw makes physics compute NaN horizontal
        // movement (sin/cos(yaw)), which corrupts position.x/z; lookAt then reads the
        // NaN position and writes NaN back into yaw, so position and yaw keep feeding
        // each other NaN. The NaN yaw/position also leaks into the movement packet, so
        // the server kicks with invalid_player_movement. Fix BOTH sides: restore
        // the last finite position AND yaw/pitch, and zero the velocity.
        let lastGoodPosition = null
        let lastGoodYaw = 0
        let lastGoodPitch = 0
        bot.on('physicsTick', () => {
            const e = bot.entity
            const posOk = Number.isFinite(e.position.x) && Number.isFinite(e.position.z)
            const yawOk = Number.isFinite(e.yaw)

            if (posOk) lastGoodPosition = e.position.clone()
            if (yawOk) lastGoodYaw = e.yaw
            if (Number.isFinite(e.pitch)) lastGoodPitch = e.pitch

            if ((!posOk || !yawOk) && lastGoodPosition) {
                console.log('[Recovery] NaN detected!', {
                    vel: `${e.velocity.x}, ${e.velocity.y}, ${e.velocity.z}`,
                    yaw: e.yaw,
                    pitch: e.pitch,
                    inWater: e.isInWater,
                    onGround: e.onGround
                })
                e.position.set(lastGoodPosition.x, lastGoodPosition.y, lastGoodPosition.z)
                e.velocity.set(0, 0, 0)
                e.yaw = lastGoodYaw
                e.pitch = lastGoodPitch
            }
        })

        const worldState = new WorldState(bot)
        const decisionTree = new MainDecisionTree()

        const botController = new BotController(bot)
        const manualModeController = new ManualModeController(bot)
        
        bot.manualMode = manualModeController
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

            // an action is running: interrupt it only if this is more important
            if (botController.isBusy) {
                botController.maybePreempt(decision)
                return
            }

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

bot.on('kicked', (reason, loggedIn) => {
    console.log(`[Main] Bot KICKED (loggedIn=${loggedIn}): ${JSON.stringify(reason)}`)
})

bot.on('end', reason => {
    console.log(`[Main] Bot disconnected: ${reason}`)
})