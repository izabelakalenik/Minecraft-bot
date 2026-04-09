const mineflayer = require('mineflayer')

function createBot() {
    return mineflayer.createBot({
        host: 'localhost',
        port: 52303,
        username: 'Bott'
    })
}

module.exports = createBot