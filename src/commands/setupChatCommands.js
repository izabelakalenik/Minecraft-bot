function setupChatCommands(bot, commandController) {
    bot.on('chat', async (username, message) => {
        if (username === bot.username) return

        try {
            await commandController.handle(username, message)
        } catch (err) {
            console.log(`[Command] ${err.message}`)
        }
    })
}

module.exports = setupChatCommands