const NIGHT_START = 13000
const NIGHT_END = 23000

class TimeState {
    constructor(bot) {
        this.bot = bot
    }

    update() {
        const time = this.bot.time.timeOfDay

        return {
            time,
            isNight: time >= NIGHT_START && time <= NIGHT_END
        }
    }
}

module.exports = TimeState