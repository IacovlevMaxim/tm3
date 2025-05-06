class NPC {
  constructor(tileSize, tileManager, player) {
    this.tileSize = tileSize;
    this.tileManager = tileManager;
    this.player = player; // Reference to the player for interaction
    this.x = 0;
    this.y = 0;
    this.speed = 2;
    this.path = []; // Stores the path to follow
    this.facing = { x: 0, y: 1 }; // Default facing direction (down)
    
    // NPC appearance properties
    this.type = 'default'; // Type can be 'dog', 'merchant', etc.
    this.color = [0, 0, 100]; // Default color (white)
    
    // Behavior properties
    this.behaviorMode = 'idle'; // Can be 'idle', 'follow', 'patrol', 'wander'
    this.followDistance = 3; // How close the NPC tries to get to target when following
    this.maxFollowDistance = 15; // Maximum distance before NPC stops following
    this.lastPathfindTime = 0;
    this.pathfindInterval = 500; // Update path every 500ms
    
    // Patrol/wander points if needed
    this.waypointList = [];
    this.currentWaypointIndex = 0;
  }

  setPathTarget(target) {
    if (!target) return;
    
    const start = { 
      x: Math.floor(this.x / this.tileSize), 
      y: Math.floor(this.y / this.tileSize) 
    };
    
    // Only recalculate path if we're close to the current target
    // or if we don't have a path
    if (this.path.length <= 1) {
      this.findPathDijkstra(start, target);
    }
  }
  
  
  // Set initial position and type/behavior
  setup(startX, startY, type = 'default', behaviorMode = 'idle') {
    this.x = startX * this.tileSize;
    this.y = startY * this.tileSize;
    this.type = type;
    this.behaviorMode = behaviorMode;
    
    // Configure based on type
    this.configureNPCType(type);
  }
  
  // Configure NPC properties based on type
  configureNPCType(type) {
    switch(type) {
      case 'dog':
        this.color = [30, 80, 80]; // Brown color in HSB
        this.speed = 3; // Dogs are faster
        this.followDistance = 2;
        this.maxFollowDistance = 12;
        break;
      case 'merchant':
        this.color = [200, 70, 90]; // Blue color
        this.speed = 1.5; // Slower
        this.behaviorMode = 'patrol';
        this.setupMerchantWaypoints();
        break;
      case 'guard':
        this.color = [0, 0, 60]; // Dark gray
        this.speed = 2.5;
        this.behaviorMode = 'patrol';
        break;
      default:
        this.color = [0, 0, 100]; // White
        this.speed = 2;
        break;
    }
  }
  
  // Setup waypoints for merchant patrol
  setupMerchantWaypoints() {
    // Just an example - in a real implementation, you might load these from a file
    this.waypointList = [
      { x: 5, y: 5 },
      { x: 10, y: 5 },
      { x: 10, y: 10 },
      { x: 5, y: 10 }
    ];
  }
  
  // Update NPC position and behavior
  update() {
    const currentTime = millis();
    
    // Handle different behaviors
    switch(this.behaviorMode) {
      case 'follow':
        this.updateFollowBehavior(currentTime);
        break;
      case 'patrol':
        this.updatePatrolBehavior();
        break;
      case 'wander':
        this.updateWanderBehavior(currentTime);
        break;
      case 'idle':
      default:
        // Do nothing when idle
        break;
    }
    
    // If there's a path to follow, move along it
    if (this.path.length > 0) {
      this.followPath();
    }
  }
  
  // Update behavior when following the player
  updateFollowBehavior(currentTime) {
    const playerGridX = Math.floor(this.player.x / this.tileSize);
    const playerGridY = Math.floor(this.player.y / this.tileSize);
    const npcGridX = Math.floor(this.x / this.tileSize);
    const npcGridY = Math.floor(this.y / this.tileSize);
    
    const distToPlayer = this.manhattanDistance(
      { x: npcGridX, y: npcGridY },
      { x: playerGridX, y: playerGridY }
    );
    
    // Check if we need to update the path
    if ((distToPlayer > this.followDistance) && 
        (currentTime - this.lastPathfindTime > this.pathfindInterval || this.path.length === 0)) {
      
      // Only follow if within max follow distance
      if (distToPlayer <= this.maxFollowDistance) {
        // Find path using Dijkstra
        this.findPathDijkstra(
          { x: npcGridX, y: npcGridY },
          { x: playerGridX, y: playerGridY }
        );
        this.lastPathfindTime = currentTime;
      } else if (this.path.length > 0) {
        // Stop following if player is too far away
        this.path = [];
      }
    } else if (distToPlayer <= this.followDistance && this.path.length > 0) {
      // Stop if we're close enough
      this.path = [];
    }
  }
  
  // Update behavior when patrolling waypoints
  updatePatrolBehavior() {
    if (this.waypointList.length === 0) return;
    
    if (this.path.length === 0) {
      // Move to next waypoint
      const nextWaypoint = this.waypointList[this.currentWaypointIndex];
      const npcGridX = Math.floor(this.x / this.tileSize);
      const npcGridY = Math.floor(this.y / this.tileSize);
      
      this.findPathDijkstra(
        { x: npcGridX, y: npcGridY },
        { x: nextWaypoint.x, y: nextWaypoint.y }
      );
      
      // Move to next waypoint in the list
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypointList.length;
    }
  }
  
  // Update behavior when wandering randomly
  updateWanderBehavior(currentTime) {
    if (this.path.length === 0 && currentTime - this.lastPathfindTime > this.pathfindInterval * 2) {
      // Choose a random point within range to wander to
      const npcGridX = Math.floor(this.x / this.tileSize);
      const npcGridY = Math.floor(this.y / this.tileSize);
      
      const wanderRadius = 10;
      let targetX, targetY;
      let attempts = 0;
      let validTarget = false;
      
      // Try to find a valid target
      while (!validTarget && attempts < 10) {
        targetX = npcGridX + Math.floor(Math.random() * wanderRadius * 2) - wanderRadius;
        targetY = npcGridY + Math.floor(Math.random() * wanderRadius * 2) - wanderRadius;
        
        // Check if target is walkable
        const tileType = this.tileManager.getTileType(targetX, targetY);
        if (tileType !== 'tree' && tileType !== 'water') {
          validTarget = true;
        }
        attempts++;
      }
      
      if (validTarget) {
        this.findPathDijkstra(
          { x: npcGridX, y: npcGridY },
          { x: targetX, y: targetY }
        );
        this.lastPathfindTime = currentTime;
      }
    }
  }
  
  // Follow the computed path
  followPath() {
    if (this.path.length === 0) return;
    
    const nextNode = this.path[0];
    const targetX = nextNode.x * this.tileSize + this.tileSize / 2;
    const targetY = nextNode.y * this.tileSize + this.tileSize / 2;
  
    // Calculate direction
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    // Update facing direction for rendering
    if (distance > 0.1) {
      this.facing.x = dx / distance;
      this.facing.y = dy / distance;
    }
  
    // Move toward the target
    if (distance < this.tileSize / 2) { // Changed from fixed value to half tile size
      this.path.shift(); // Reached the node, remove it from the path
      
      // If the path is now empty, we've completed it
      if (this.path.length === 0) {
        // Optionally, add some behavior here when path is complete
        console.log("NPC reached end of path");
      }
    } else {
      // Move at full speed on path
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }
  
  // Set target using Dijkstra pathfinding
  setTarget(gridX, gridY) {
    const start = { 
      x: Math.floor(this.x / this.tileSize), 
      y: Math.floor(this.y / this.tileSize) 
    };
    const goal = { x: gridX, y: gridY };
    this.findPathDijkstra(start, goal);
  }
  
  // Manhattan distance heuristic
  manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  
  // Dijkstra's Pathfinding Algorithm (doesn't use heuristics unlike A*)
  findPathDijkstra(start, goal) {
    // Initialize data structures
    const openSet = [];
    const closedSet = new Set();
    const gScore = {};
    const cameFrom = {};
    
    // Set initial values
    gScore[`${start.x},${start.y}`] = 0;
    openSet.push(start);
    
    while (openSet.length > 0) {
      // Find node with lowest g-score in openSet
      let current = openSet[0];
      let lowestScore = gScore[`${current.x},${current.y}`];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        const node = openSet[i];
        const nodeKey = `${node.x},${node.y}`;
        if (gScore[nodeKey] < lowestScore) {
          lowestScore = gScore[nodeKey];
          current = node;
          currentIndex = i;
        }
      }
      
      // If we reached the goal
      if (current.x === goal.x && current.y === goal.y) {
        this.path = this.reconstructPath(cameFrom, current);
        return;
      }
      
      // Remove current from openSet and add to closedSet
      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);
      
      // Check all neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        // Skip if already evaluated
        if (closedSet.has(neighborKey)) continue;
        
        // Calculate tentative g-score
        const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;
        
        // If this path is better than any previous one
        const inOpenSet = openSet.some(node => node.x === neighbor.x && node.y === neighbor.y);
        if (!inOpenSet) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore[neighborKey] || Infinity)) {
          continue; // Not a better path
        }
        
        // This path is the best until now, record it
        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
      }
    }
    
    // No path found
    this.path = [];
  }
  
  // Get walkable neighbors
  getNeighbors(node) {
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];
    const neighbors = [];
  
    for (const dir of directions) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;
      const tileType = this.tileManager.getTileType(nx, ny);
      
      if (tileType !== 'tree' && tileType !== 'water') { // Assume 'tree' and 'water' are obstacles
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  }
  
  // Reconstruct path from cameFrom map
  reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom[`${current.x},${current.y}`]) {
      current = cameFrom[`${current.x},${current.y}`];
      path.unshift(current);
    }
    // Remove the starting point
    if (path.length > 0) {
      path.shift();
    }
    return path;
  }
  
  // Draw NPC
  draw() {
    push();
    
    // Different appearances based on NPC type
    switch(this.type) {
      case 'dog':
        this.drawDog();
        break;
      case 'merchant':
        this.drawMerchant();
        break;
      case 'guard':
        this.drawGuard();
        break;
      default:
        this.drawDefault();
        break;
    }
    
    // Debug: Draw path (uncomment for debugging)
    /*
    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    beginShape();
    for (const node of this.path) {
      vertex(node.x * this.tileSize + this.tileSize / 2, 
             node.y * this.tileSize + this.tileSize / 2);
    }
    endShape();
    */
    
    pop();
  }
  
  // Draw dog appearance
  drawDog() {
    // Base dog body
    fill(this.color[0], this.color[1], this.color[2]);
    ellipse(this.x + this.tileSize / 2, this.y + this.tileSize / 2, 
           this.tileSize * 0.8, this.tileSize * 0.6);
    
    // Head
    ellipse(this.x + this.tileSize / 2 + this.facing.x * this.tileSize * 0.3,
           this.y + this.tileSize / 2 + this.facing.y * this.tileSize * 0.3,
           this.tileSize * 0.5, this.tileSize * 0.5);
    
    // Ears
    fill(this.color[0], this.color[1] * 0.8, this.color[2] * 0.8); // Darker ears
    
    // Ear positions adjust based on facing direction
    const earOffsetX = this.facing.y * 0.15 * this.tileSize;
    const earOffsetY = -this.facing.x * 0.15 * this.tileSize;
    
    // Left ear
    ellipse(this.x + this.tileSize / 2 + this.facing.x * this.tileSize * 0.35 + earOffsetX,
           this.y + this.tileSize / 2 + this.facing.y * this.tileSize * 0.35 + earOffsetY,
           this.tileSize * 0.25, this.tileSize * 0.3);
    
    // Right ear
    ellipse(this.x + this.tileSize / 2 + this.facing.x * this.tileSize * 0.35 - earOffsetX,
           this.y + this.tileSize / 2 + this.facing.y * this.tileSize * 0.35 - earOffsetY,
           this.tileSize * 0.25, this.tileSize * 0.3);
    
    // Eyes
    fill(0);
    const eyeOffsetX = this.facing.y * 0.1 * this.tileSize;
    const eyeOffsetY = -this.facing.x * 0.1 * this.tileSize;
    
    // Left eye
    ellipse(this.x + this.tileSize / 2 + this.facing.x * this.tileSize * 0.4 + eyeOffsetX,
           this.y + this.tileSize / 2 + this.facing.y * this.tileSize * 0.4 + eyeOffsetY,
           this.tileSize * 0.1, this.tileSize * 0.1);
    
    // Right eye
    ellipse(this.x + this.tileSize / 2 + this.facing.x * this.tileSize * 0.4 - eyeOffsetX,
           this.y + this.tileSize / 2 + this.facing.y * this.tileSize * 0.4 - eyeOffsetY,
           this.tileSize * 0.1, this.tileSize * 0.1);
    
    // Nose
    fill(0);
    ellipse(this.x + this.tileSize / 2 + this.facing.x * this.tileSize * 0.5,
           this.y + this.tileSize / 2 + this.facing.y * this.tileSize * 0.5,
           this.tileSize * 0.15, this.tileSize * 0.1);
    
    // Tail
    fill(this.color[0], this.color[1], this.color[2]);
    push();
    translate(this.x + this.tileSize / 2 - this.facing.x * this.tileSize * 0.3,
             this.y + this.tileSize / 2 - this.facing.y * this.tileSize * 0.3);
    rotate(frameCount * 0.1); // Wagging tail
    ellipse(0, -this.tileSize * 0.25, this.tileSize * 0.4, this.tileSize * 0.15);
    pop();
    
    // Legs
    stroke(this.color[0], this.color[1] * 0.9, this.color[2] * 0.7);
    strokeWeight(this.tileSize * 0.15);
    
    // Front legs
    const legOffsetX = Math.sin(frameCount * 0.2) * this.tileSize * 0.1;
    line(this.x + this.tileSize * 0.4, this.y + this.tileSize * 0.6,
         this.x + this.tileSize * 0.4, this.y + this.tileSize * 0.8 + legOffsetX);
    line(this.x + this.tileSize * 0.6, this.y + this.tileSize * 0.6,
         this.x + this.tileSize * 0.6, this.y + this.tileSize * 0.8 - legOffsetX);
    
    // Back legs
    line(this.x + this.tileSize * 0.35, this.y + this.tileSize * 0.7,
         this.x + this.tileSize * 0.2, this.y + this.tileSize * 0.85 - legOffsetX);
    line(this.x + this.tileSize * 0.65, this.y + this.tileSize * 0.7,
         this.x + this.tileSize * 0.8, this.y + this.tileSize * 0.85 + legOffsetX);


      if (this.behaviorMode === 'custom') {
    // Draw a small yellow circle above the dog
    fill(60, 100, 100); // Yellow
    noStroke();
    ellipse(
      this.x + this.tileSize / 2,
      this.y - this.tileSize / 4,
      this.tileSize / 4,
      this.tileSize / 4
    );
  }
  }
  
  // Draw merchant appearance
  drawMerchant() {
    // Body
    fill(this.color[0], this.color[1], this.color[2]);
    rect(this.x + this.tileSize * 0.2, this.y + this.tileSize * 0.3, 
        this.tileSize * 0.6, this.tileSize * 0.7);
    
    // Head
    ellipse(this.x + this.tileSize / 2, this.y + this.tileSize * 0.3, 
           this.tileSize * 0.5, this.tileSize * 0.5);
    
    // Hat
    fill(40, 70, 70); // Brown hat
    arc(this.x + this.tileSize / 2, this.y + this.tileSize * 0.3,
       this.tileSize * 0.7, this.tileSize * 0.2, PI, TWO_PI);
    
    // Eyes
    fill(0);
    ellipse(this.x + this.tileSize * 0.4, this.y + this.tileSize * 0.3,
           this.tileSize * 0.05, this.tileSize * 0.05);
    ellipse(this.x + this.tileSize * 0.6, this.y + this.tileSize * 0.3,
           this.tileSize * 0.05, this.tileSize * 0.05);
    
    // Backpack/items
    fill(40, 60, 80); // Brown bag
    rect(this.x + this.tileSize * 0.1, this.y + this.tileSize * 0.4,
        this.tileSize * 0.2, this.tileSize * 0.4);
  }
  
  // Draw guard appearance
  drawGuard() {
    // Body
    fill(this.color[0], this.color[1], this.color[2]);
    rect(this.x + this.tileSize * 0.25, this.y + this.tileSize * 0.3, 
        this.tileSize * 0.5, this.tileSize * 0.7);
    
    // Head
    ellipse(this.x + this.tileSize / 2, this.y + this.tileSize * 0.3, 
           this.tileSize * 0.4, this.tileSize * 0.4);
    
    // Helmet
    fill(0, 0, 40); // Dark helmet
    arc(this.x + this.tileSize / 2, this.y + this.tileSize * 0.25,
       this.tileSize * 0.5, this.tileSize * 0.5, PI, TWO_PI);
    
    // Spear/weapon
    stroke(0, 0, 60);
    strokeWeight(this.tileSize * 0.06);
    line(this.x + this.tileSize * 0.3, this.y + this.tileSize * 0.3,
         this.x + this.tileSize * 0.3, this.y + this.tileSize * 0.9);
    
    // Shield
    noStroke();
    fill(0, 0, 40);
    arc(this.x + this.tileSize * 0.7, this.y + this.tileSize * 0.5,
       this.tileSize * 0.3, this.tileSize * 0.5, -HALF_PI, HALF_PI);
  }
  
  // Draw default NPC appearance
  drawDefault() {
    fill(this.color[0], this.color[1], this.color[2]);
    rect(this.x, this.y, this.tileSize, this.tileSize);
    
    // Draw facing direction
    fill(255, 0, 0);
    triangle(
      this.x + this.tileSize / 2, this.y + this.tileSize / 2,
      this.x + this.tileSize / 2 + this.facing.x * 15,
      this.y + this.tileSize / 2 + this.facing.y * 15,
      this.x + this.tileSize / 2 + this.facing.y * 10,
      this.y + this.tileSize / 2 - this.facing.x * 10
    );
  }
}