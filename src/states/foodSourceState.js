const FOOD_SEARCH_DISTANCE = 32

const EDIBLE_CROPS = [
    'carrots',
    'potatoes',
    'beetroots',
    'wheat',
    'melon',
    'pumpkin',
    'sweet_berry_bush'
]

const EDIBLE_ANIMALS = [
    'cow',
    'mooshroom',
    'pig',
    'chicken',
    'sheep',
    'rabbit'
]

class FoodSourceState {
    constructor(bot) {
        this.bot = bot
    }

    update() {
        const crop = this.findNearbyCrop()
        const animal = this.findNearbyAnimal()

        return {
            nearbyCrop: crop,
            cropDistance: this.distanceTo(crop),
            nearbyAnimal: animal,
            animalDistance: this.distanceTo(animal)
        }
    }

    distanceTo(target) {
        return target
            ? this.bot.entity.position.distanceTo(target.position)
            : null
    }

    findNearbyCrop() {
        return this.bot.findBlock({
            matching: block => block && EDIBLE_CROPS.includes(block.name),
            maxDistance: FOOD_SEARCH_DISTANCE
        })
    }

    findNearbyAnimal() {
        return this.bot.nearestEntity(entity => {
            if (!entity.name) return false

            const distance = this.bot.entity.position.distanceTo(entity.position)

            return (
                EDIBLE_ANIMALS.includes(entity.name) &&
                distance <= FOOD_SEARCH_DISTANCE
            )
        })
    }
}

module.exports = FoodSourceState
