# How to run the project

## Add the bot to the Minecraft server
1. Open the project and run `npm install`
1. Open Minecraft
2. Create a world in a singleplayer mode and start the game
3. Open world settings and click `Open to LAN`
4. Paste the port number from the [botConfig.js](./src/config/botConfig.js)
5. Run `node src/index.js` command in the project's terminal (in the root folder)

## Add more task for the bot
1. Open [planner.js](./src/ai/planner.js) file in the *ai* folder of the project
2. Add a task to the *taskPlan* list
3. Implement the proper task handler in the *for loop* below taskPlan (if it doesn't exist)

## Additional info
- If you want to change bot configuration, edit [botConfig.js](./src/config/botConfig.js) file, not [createBot.js](./src/bot/createBot.js)
- When you add a task to the *taskPlan* check the **item name** every time to ensure it exists in the world or is available in the bot area