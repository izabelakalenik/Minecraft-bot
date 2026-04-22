const mineflayer = require('mineflayer')

// If you wanto to change bot configuration, 
// do it in botConfig.js - here is the default configuration
function createBot(config = {}) {
    return mineflayer.createBot({
        host: config.host || 'localhost',
        port: config.port || 51910,
        username: config.username || 'Bot12',
        version: config.version || false
    })
}

module.exports = createBot