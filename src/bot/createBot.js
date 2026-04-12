const mineflayer = require('mineflayer')

function createBot() {
    return mineflayer.createBot({
        host: 'localhost',
        port: 51910,
        username: 'Bot12'
    })
}

module.exports = createBot