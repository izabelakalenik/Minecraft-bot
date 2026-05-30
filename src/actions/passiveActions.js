// Here are implemented actions that are doing nothing - waiting for a state to change

async function stayInShelter() {
    console.log('[PassiveActions] Staying safely in shelter.')
}

async function continueSleeping() {
    console.log('[PassiveActions] Zzz... Bot is sleeping.')
}

module.exports = {
    stayInShelter,
    continueSleeping
}
