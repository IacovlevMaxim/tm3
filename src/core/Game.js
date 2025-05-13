class Game {
  constructor() {
    this.tileSize = 50;
    this.player = null;
    this.tileManager = null;
    this.itemManager = null;
    this.npcs = []; // Array to hold multiple NPCs
    this.pathfinderMap = null; // Pathfinder map visualization
    this.px = 0; // Placeholder for rocket x position
    this.py = 0; // Placeholder for rocket y position

    this.rocketImage = null; // Placeholder for rocket image

  
    // Track explored chunks for item generation
    this.exploredChunks = new Set();
    this.chunkSize = 8; // 8x8 grid cells per chunk
  
    // Item generation probabilities
    this.itemTypes = [
      { type: 'wood', probability: 2, clusters: true, clusterSize: { min: 1, max: 4 } },
      { type: 'stone', probability: 1, clusters: true, clusterSize: { min: 1, max: 3 } },
      { type: 'food', probability: 0.8, clusters: false },
      { type: 'tool', probability: 0.5, clusters: false },
      { type: 'metal', probability: 0.2, clusters: true, clusterSize: { min: 1, max: 2 } },
      { type: 'gem', probability: 0.05, clusters: false }
    ];
  }

// Update the preload method
preload() {
  this.tileManager = new TileManager(this.tileSize);
  this.tileManager.preload();
  this.itemManager = new ItemManager(this.tileSize);
  this.player = new Player(this.tileSize, this.tileManager, this.itemManager);
  this.rocketImage = loadImage("assets/rocket.png");

  
  // Create a dog NPC
  const dogNPC = new NPC(this.tileSize, this.tileManager, this.player);
  this.npcs.push(dogNPC);
  
  // Create a merchant NPC
  const merchantNPC = new NPC(this.tileSize, this.tileManager, this.player);
  this.npcs.push(merchantNPC);
  
  // Create pathfinder map
  this.pathfinderMap = new PathfinderMap(this.tileManager, this.tileSize);
}

setup() {
  colorMode(HSB);
  textFont('monospace');
  this.player.setup();
  
  // Setup NPCs with different types and behaviors
  this.npcs[0].setup(5, 5, 'dog', 'follow'); // Dog that follows player
  this.npcs[1].setup(10, 10, 'merchant', 'patrol'); // Merchant that patrols
  
  // Setup the pathfinder map with player reference
  this.pathfinderMap.setup(this.player);


  // Generate items for the initial visible area
  this.updateVisibleArea();
}

// Update the update method

update() {
  this.player.update();
  
  // Check if we should update the dog to follow the path
  if (this.pathfinderMap.isFollowingPath() && this.npcs.length > 0) {
    // Get the next target from the path
    const nextTarget = this.pathfinderMap.getNextPathTarget();
    
    if (nextTarget) {
      // Make the dog follow the path
      // We need to pass the complete target object, not just coordinates
      this.npcs[0].setPathTarget(nextTarget);
      
      // Manually update the dog (it won't use its normal update logic)
      this.npcs[0].followPath();
    }
  } else {
    // Normal NPC updates
    for (const npc of this.npcs) {
      npc.update();
    }
  }

  // Check if we need to generate items for newly explored areas
  this.updateVisibleArea();
  
  // Update the pathfinder map to recalculate if the player has moved far
  if (this.pathfinderMap.isFollowingPath()) {
    const playerGridX = Math.floor(this.player.x / this.tileSize);
    const playerGridY = Math.floor(this.player.y / this.tileSize);
    const pathStartX = this.pathfinderMap.startPos.x;
    const pathStartY = this.pathfinderMap.startPos.y;
    
    // Calculate distance between player and path start
    const distance = Math.abs(playerGridX - pathStartX) + 
                     Math.abs(playerGridY - pathStartY);
    
    // If player moved more than 5 tiles from path start, update the path
    if (distance > 5) {
      this.pathfinderMap.updateStartPosition();
    }
  }


  // Check if we need to generate items for newly explored areas
  this.updateVisibleArea();
}

  updateVisibleArea() {
    // Calculate the chunks visible in the current screen
    const leftBound = this.player.x - width / 2;
    const rightBound = this.player.x + width / 2;
    const topBound = this.player.y - height / 2;
    const bottomBound = this.player.y + height / 2;

    // Convert to chunk coordinates (with buffer)
    const extraBuffer = 1; // Extra chunk buffer
    const minChunkX = Math.floor(leftBound / (this.tileSize * this.chunkSize)) - extraBuffer;
    const maxChunkX = Math.ceil(rightBound / (this.tileSize * this.chunkSize)) + extraBuffer;
    const minChunkY = Math.floor(topBound / (this.tileSize * this.chunkSize)) - extraBuffer;
    const maxChunkY = Math.ceil(bottomBound / (this.tileSize * this.chunkSize)) + extraBuffer;

    // Check each chunk in the visible area
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
      for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
        const chunkKey = `${chunkX},${chunkY}`;

        // If we haven't generated items for this chunk yet, do so
        if (!this.exploredChunks.has(chunkKey)) {
          this.generateItemsForChunk(chunkX, chunkY);
          this.exploredChunks.add(chunkKey);
        }
      }
    }
  }

  togglePathFollowing() {
    // Toggle the state
    this.pathfinderMap.followPathActive = !this.pathfinderMap.followPathActive;
    
    // If turning on path following, make sure we have a path first
    if (this.pathfinderMap.followPathActive && this.pathfinderMap.path.length === 0) {
      // Update start position to current player position
      this.pathfinderMap.updateStartPosition();
      // If we still don't have a valid path, turn off path following
      if (this.pathfinderMap.path.length === 0) {
        this.pathfinderMap.followPathActive = false;
        console.log("No valid path available");
      }
    }
    
    // When turning off path following, reset the NPCs to normal behavior
    if (!this.pathfinderMap.followPathActive) {
      // Reset dog to follow player
      this.npcs[0].behaviorMode = 'follow';
    }
  }

  generateItemsForChunk(chunkX, chunkY) {
    // Calculate the world coordinates for this chunk
    const startX = chunkX * this.chunkSize;
    const startY = chunkY * this.chunkSize;

    // Determine if this chunk should have a special area (1 in 10 chance)
    const hasSpecialArea = Math.random() < 0.1;

    if (hasSpecialArea) {
      this.createSpecialAreaInChunk(startX, startY);
    } else {
      // Normal item distribution
      this.generateNormalItemsInChunk(startX, startY);
    }
  }

  generateNormalItemsInChunk(startX, startY) {
    // How many items to attempt to place (15% of cells in the chunk)
    const placementAttempts = Math.floor(this.chunkSize * this.chunkSize * 0.15);

    for (let i = 0; i < placementAttempts; i++) {
      // Random position within this chunk
      const x = startX + Math.floor(Math.random() * this.chunkSize);
      const y = startY + Math.floor(Math.random() * this.chunkSize);

      // Only place items on valid tiles
      if (this.isValidItemPlacement(x, y)) {
        // Determine item type based on probability
        const roll = Math.random() * 100;
        let cumulativeProbability = 0;

        for (const itemType of this.itemTypes) {
          cumulativeProbability += itemType.probability;

          if (roll < cumulativeProbability) {
            // Add the item
            this.itemManager.addItem(x, y, itemType.type);

            // If this item type forms clusters, add additional items nearby
            if (itemType.clusters) {
              this.generateItemCluster(x, y, itemType.type,
                Math.floor(Math.random() *
                  (itemType.clusterSize.max - itemType.clusterSize.min + 1)) +
                itemType.clusterSize.min);
            }
            break;
          }
        }
      }
    }
  }

  generateItemCluster(centerX, centerY, type, size) {
    // Generate a cluster of items around the center point
    for (let i = 0; i < size; i++) {
      // Random offset from center (-2 to 2 grid cells)
      const offsetX = Math.floor(Math.random() * 5) - 2;
      const offsetY = Math.floor(Math.random() * 5) - 2;

      // Calculate new position
      const x = centerX + offsetX;
      const y = centerY + offsetY;

      // Ensure we're not placing on the center tile itself
      if ((offsetX !== 0 || offsetY !== 0) && this.isValidItemPlacement(x, y)) {
        this.itemManager.addItem(x, y, type);
      }
    }
  }

  createSpecialAreaInChunk(startX, startY) {
    // Choose a special area type
    const areaTypes = [
      {
        name: 'abandoned_camp',
        items: [
          { type: 'food', count: 3 },
          { type: 'tool', count: 2 },
          { type: 'wood', count: 4 }
        ],
        radius: 3
      },
      {
        name: 'mining_site',
        items: [
          { type: 'stone', count: 5 },
          { type: 'metal', count: 3 },
          { type: 'tool', count: 1 }
        ],
        radius: 4
      },
      {
        name: 'treasure_cache',
        items: [
          { type: 'gem', count: 3 },
          { type: 'metal', count: 2 }
        ],
        radius: 2
      },
      {
        name: 'forest_clearing',
        items: [
          { type: 'wood', count: 6 },
          { type: 'food', count: 4 }
        ],
        radius: 5
      }
    ];

    // Pick a random area type
    const areaType = areaTypes[Math.floor(Math.random() * areaTypes.length)];

    // Find a suitable center point within the chunk
    let centerX = startX + Math.floor(this.chunkSize / 2);
    let centerY = startY + Math.floor(this.chunkSize / 2);

    // Find valid ground to place the special area
    let attempts = 0;
    while (!this.isValidItemPlacement(centerX, centerY) && attempts < 10) {
      centerX = startX + Math.floor(Math.random() * this.chunkSize);
      centerY = startY + Math.floor(Math.random() * this.chunkSize);
      attempts++;
    }

    if (attempts >= 10) {
      // Couldn't find a valid spot
      return;
    }

    // Place items in the special area
    for (const item of areaType.items) {
      for (let i = 0; i < item.count; i++) {
        // Choose a random position within the radius of the center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * areaType.radius;

        const offsetX = Math.round(Math.cos(angle) * distance);
        const offsetY = Math.round(Math.sin(angle) * distance);

        const x = centerX + offsetX;
        const y = centerY + offsetY;

        if (this.isValidItemPlacement(x, y)) {
          this.itemManager.addItem(x, y, item.type);
        }
      }
    }
  }

  isValidItemPlacement(gridX, gridY) {
    // Check if the tile is walkable (not an obstacle)
    const tileType = this.tileManager.getTileType(gridX, gridY);
    if (tileType === 'tree' || tileType === 'water') {
      return false;
    }

    // Check if there's already an item at this location
    if (this.itemManager.getItemAt(gridX, gridY)) {
      return false;
    }

    // Don't place items right at player spawn (within 3 tiles)
    if (Math.abs(gridX) < 3 && Math.abs(gridY) < 3) {
      return false;
    }

    return true;
  }

// Update the draw method
draw() {
  background(135, 50, 90);
  this.player.update();


  
  push();
  this.player.applyCameraTransform();
  this.tileManager.draw(this.player.x, this.player.y);
  this.itemManager.draw();
  
  // Draw all NPCs
  for (const npc of this.npcs) {
    npc.draw();
  }
  
  image(this.rocketImage, this.pathfinderMap.startPos.x, this.pathfinderMap.startPos.y, this.tileSize, this.tileSize);
  this.player.draw();
  pop();

  // Draw inventory UI
  this.player.drawInventory();
  
  // Draw pathfinder map if visible
  this.pathfinderMap.draw();
}



setNPCTarget(gridX, gridY) {
  // Set target for first NPC (for mouse click interaction)
  if (this.npcs.length > 0) {
    this.npcs[0].setTarget(gridX, gridY);
  }
}
  handleKeyRelease() {
    this.player.handleKeyRelease();
  }

  handleInput() {
    this.player.handleInput();
  }

  handleKeyboardShortcuts(key) {
    if (key === 'm' || key === 'M') {
      this.pathfinderMap.toggle();
      return true;
    } else if (key === 'n' || key === 'N') {
      this.pathfinderMap.toggleMiniMap();
      return true;
    }
    return false;
  }

  handleMousePressed() {
    // First check if the pathfinder map handled the click
    if (this.pathfinderMap.handleMousePressed()) {
      // If the path following state changed, update NPC behavior
      if (this.pathfinderMap.isFollowingPath()) {
        // Change dog behavior to follow path instead of player
        this.npcs[0].behaviorMode = 'custom';
      } else {
        // Reset dog to follow player
        this.npcs[0].behaviorMode = 'follow';
      }
      
      return true; // Click was handled by pathfinder map
    }
    
    // Otherwise handle as normal
    return false;
  }
  
  
  handleMouseMoved() {
    // Handle mouse movement for pathfinder map
    return this.pathfinderMap.handleMouseMoved();
  }
  
  // Toggle pathfinder map visibility
  togglePathfinderMap() {
    this.pathfinderMap.toggle();
  }
  
  // Update the setNPCTarget method
  setNPCTarget(gridX, gridY) {
    // Set target for first NPC (for mouse click interaction)
    if (this.npcs.length > 0) {
      this.npcs[0].setTarget(gridX, gridY);
    }  
}
}
