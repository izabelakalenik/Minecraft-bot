class DecisionEngine {
    constructor(bot, mcData, collectWood, craftWoodenAxe, printInventory) {
        this.bot = bot
        this.mcData = mcData
        this.collectWood = collectWood
        this.craftWoodenAxe = craftWoodenAxe
        this.printInventory = printInventory
    }

    async run() {
        await this.collectWood(this.bot, this.mcData, this.printInventory)
        await this.craftWoodenAxe(this.bot, this.mcData, this.printInventory)

        console.log('Zadanie wykonane')
    }
}

module.exports = DecisionEngine