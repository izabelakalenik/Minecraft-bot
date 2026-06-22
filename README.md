# Minecraft Bot

An autonomous Minecraft bot whose behavior is driven by a **cascading system of decision trees**. The bot perceives its surroundings, evaluates the current state of the world, and acts entirely on its own - managing survival, adapting to difficult terrain, exploring, and optionally carrying out user commands typed in chat.

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Operating Modes](#operating-modes)
- [Chat Commands](#chat-commands)
- [Run the Project](#run-the-project)
- [Extending the Bot](#extending-the-bot)

## Overview

The bot is built around a layered decision-making engine. A top-level **Main** tree queries a set of specialized sub-trees in a fixed priority order. The first decision whose conditions match the current world state is accepted and executed. If nothing matches, the bot falls back to its default `EXPLORE` behavior.

The system was designed to handle a few core responsibilities:

- **Survival** - reacting to hunger, threats, and the time of day.
- **Adaptation** - navigating difficult terrain and taking exploratory action.
- **User control** - executing tasks issued through chat commands.

## Tech Stack

- **JavaScript** + **Node.js**
- **[Mineflayer](https://github.com/PrismarineJS/mineflayer)** - a high-level Minecraft client API that lets the bot connect directly over Minecraft's network protocol, with no server-side mods required. From the server's perspective, the bot is just another player.

The architecture is **event-driven**, reacting to server events such as:

- `login` - logging in to the server
- `spawn` - appearing in the world
- `error` - runtime errors
- `end` - disconnection from the server

## Project Architecture

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

### WorldState

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

### Decision Trees
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

The `MainDecisionTree` evaluates all registered trees in priority order and returns the first valid decision. They are evaluated accordigly:

```
threat  →  night  →  hunger  →  exploration
```

<img width="3528" height="1943" alt="Decision Trees - minecraft bot" src="https://github.com/user-attachments/assets/5c6db1c2-0e0c-4a8b-ac41-ba578c8a3e6c" />

If none of the sub-trees returns a decision, the bot defaults to `EXPLORE`.

---

### BotController

`BotController` is responsible for executing decisions.

Responsibilities:

* mapping decision types to actions
* preventing multiple actions from running simultaneously
* handling action execution errors

---

### Actions

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

## Operating Modes

The bot runs in one of two modes.

### Auto

The default mode on startup. The bot acts on its own, with no user input. Roughly every **1.5 seconds**, a decision loop refreshes the world state and selects an action, reacting to threats, time of day, hunger, and exploration opportunities.

Enable with:

```
auto
```

### Manual

Disables the AI. The decision loop is skipped and the bot only executes commands typed in chat - giving you full control when automatic decisions aren't desired.

Enable with:

```
manual
```

## Chat Commands

### Neutral commands (available in any mode)

| Command | Description |
| --- | --- |
| `status` | Show hunger, health, and other parameters |
| `inventory` | Show the contents of the bot's inventory |

### Manual commands (manual mode only)

| Command | Description |
| --- | --- |
| `follow me` | Bot walks over to the user |
| `toss <item> [n]` | Drop the specified items |
| `place <item> [n]` | Place items |
| `eat` | Eat |
| `craft <item> [n]` | Craft the specified item |
| `dig <resource> [n]` | Mine the specified resource |

## Run the Project

The game world is hosted locally using Minecraft's **Open to LAN** option. Because Minecraft assigns a random network port in this mode, that port must be written into the config file before launching the bot.

1. Open the project and install dependencies:

   ```bash
   npm install
   ```

2. Open Minecraft.

3. Create a world in singleplayer mode and start the game.

4. Open the world settings and click **Open to LAN** - note the randomly generated port number.

5. Configure the connection settings (including the port) in `src/config/botConfig.js`.

6. Run the bot:

   ```bash
   node src/index.js
   ```

The bot connects to the server as an additional player and starts running in **auto** mode.

## Extending the Bot

### Add a new Decision Tree

1. Create a new tree in `src/ai/trees`.
2. Implement its `decide(state)` method.
3. Register it in `MainDecisionTree`.

### Add a new Action

1. Create a new action in `src/actions`.
2. Add a new decision type in `decisionTypes.js`.
3. Register the action in `BotController`.

### Conventions

- Use `console.log()` for development and debugging.
- Use `bot.chat()` only for player-facing messages.
- Keep responsibilities separated (WorldState → decisions → actions → execution).

