async function stayInShelter(bot) {
    console.log('[PassiveActions] Staying safely in shelter.')
}

async function continueSleeping(bot, mcData, decision) {
    console.log('[PassiveActions] Zzz... Bot is sleeping.')
}

module.exports = {
    stayInShelter,
    continueSleeping
}
