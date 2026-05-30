# How to run the project

## Add the bot to the Minecraft server

1. Open the project and run:

   ```bash
   npm install
   ```

2. Open Minecraft.

3. Create a world in singleplayer mode and start the game.

4. Open world settings and click **Open to LAN**.

5. Configure the connection settings in `src/config/botConfig.js`.

6. Run:

   ```bash
   node src/index.js
   ```

---

# Project architecture

The bot is built around a simple AI loop:

```text
WorldState
    ↓
Decision Trees
    ↓
BotController
    ↓
Actions
```

Every few seconds the bot:

1. Updates the WorldState.
2. Evaluates Decision Trees.
3. Selects a decision.
4. Executes the corresponding action.

---

## WorldState

`WorldState` is responsible for gathering information about the world and the bot.

Examples:

* health
* hunger
* time of day
* nearby entities
* inventory information
* environment information

WorldState should only read and expose information. It should never perform actions.

---

## Decision Trees

Decision Trees are responsible for deciding what the bot should do based on the current WorldState.

Each tree focuses on a specific area of behaviour and returns either:

```js
null
```

or

```js
{
    type: DECISION_TYPES.SOME_ACTION
}
```

The `MainDecisionTree` evaluates all registered trees in priority order and returns the first valid decision.

---

## BotController

`BotController` is responsible for executing decisions.

Responsibilities:

* mapping decision types to actions
* preventing multiple actions from running simultaneously
* handling action execution errors

---

## Actions

Actions contain the actual implementation of bot behaviour.

Examples:

* movement
* combat
* crafting
* mining
* exploration
* inventory management

Each action receives:

```js
(bot, mcData, decision)
```

Actions should execute behaviour, not make decisions.

---

## ManualModeController

`ManualModeController` allows the AI loop to be temporarily paused.

When manual mode is enabled:

* Decision Trees are not evaluated.
* Automatic actions are not executed.
* The bot can be controlled through commands.

When manual mode is disabled, the AI loop resumes normally.

---

## CommandController

`CommandController` handles chat commands sent by players.

Examples:

- follow me
- auto/manual
- status
- inventory

Responsibilities:

* processing commands
* triggering manual actions
* enabling/disabling manual mode
* displaying bot information

New commands should be implemented through the CommandController rather than directly in `index.js`.


---

# Extending the bot

## Add a new Decision Tree

1. Create a new tree in `src/ai/trees`.
2. Implement its `decide(state)` method.
3. Register it in `MainDecisionTree`.

---

## Add a new Action

1. Create a new action in `src/actions`.
2. Add a new decision type in `decisionTypes.js`.
3. Register the action in `BotController`.

---

# Additional information

* Use `console.log()` for development and debugging.
* Use `bot.chat()` only for player-facing messages.
* Keep responsibilities separated:

   * WorldState gathers information.
   * Decision Trees make decisions.
   * Actions perform work.
   * BotController executes actions.
