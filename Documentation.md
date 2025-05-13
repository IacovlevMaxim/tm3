# 🌌 Game Design Document (GDD)

## 1. Storyline

The protagonist crash-lands on an alien planet resembling Earth. With only a pendant from his sister and the will to return home, he must survive in a hostile environment, gather resources, and repair his damaged spaceship. To leave the planet, he needs to craft five critical components: an engine, a wing, fuel, a catapult, and a navigator. Along the way, he may discover a hidden settlement and meet a girl who longs to escape with him.

---

## 2. Game Physics

- Certain NPCs (e.g., enemies or animals) cannot enter water.
- Trees are solid obstacles and cannot be passed through.
- However, the player can navigate between tight spaces between trees.
- Items and resources can be picked up from the environment.
- The environment supports collision detection for both the player and AI entities.

---

## 3. Interaction Mechanisms

- **E key**: Pick up or drop an item.
- **F key**: Use an equipped item.
- **Inventory logic**: When no inventory slot is selected, the player can pick up new items.
- **Companion system**: A dog companion follows the player throughout the game.
- **Minimap**: Displays a path to a target location, dynamically guiding the player in real-time.

---

## 4. AI Functionality

- **Dog AI**: Constantly follows the player’s current position.
- **Patrol AI**: Certain creatures or NPCs move in a loop around a fixed point.
- AI respects environmental limits such as trees or water where applicable.

---

## 5. Resource and Crafting System

The player collects resources from the environment (e.g., minerals, flora, mechanical scraps). These are used to craft the following rocket components:

- Engine: _(Insert required resources here)_
- Wing: _(Insert required resources here)_
- Fuel: _(Insert required resources here)_
- Catapult: _(Insert required resources here)_
- Navigator: _(Insert required resources here)_

Crafting requires a nearby workbench or crafting station. Recipes become available as the player progresses through exploration and interactions with the environment.
