const BED_SEARCH_DISTANCE = 16

class EnvironmentState {
    constructor(bot) {
        this.bot = bot
    }

    update() {
        return {
            bedNearby: this.findBedNearby(),
            isSheltered: this.checkIsSheltered()
        }
    }

    findBedNearby() {
        return this.bot.findBlock({
            matching: block => block && block.name.includes('bed'),
            maxDistance: BED_SEARCH_DISTANCE
        })
    }

    checkIsSheltered() {
        const pos = this.bot.entity.position.floored()

        const blocksToCheck = [
            pos.offset(0, 2, 0),

            pos.offset(1, 0, 0),
            pos.offset(-1, 0, 0),
            pos.offset(0, 0, 1),
            pos.offset(0, 0, -1),

            pos.offset(1, 1, 0),
            pos.offset(-1, 1, 0),
            pos.offset(0, 1, 1),
            pos.offset(0, 1, -1)
        ]

        const solidBlocks = blocksToCheck.filter(blockPos => {
            const block = this.bot.blockAt(blockPos)

            return (
                block &&
                block.name !== 'air' &&
                block.name !== 'cave_air' &&
                block.name !== 'void_air'
            )
        })

        return solidBlocks.length === blocksToCheck.length
    }
}

module.exports = EnvironmentState