class NPC {
    constructor(tileSize, tileManager, player) {
      this.tileSize = tileSize;
      this.tileManager = tileManager;
      this.player = player; // Reference to the player for interaction
      this.x = 0;
      this.y = 0;
      this.speed = 2;
      this.path = []; // Stores the path to follow
      this.target = null; // Current target position
      this.facing = { x: 0, y: 1 }; // Default facing direction (down)
    }
  
    // Set initial position
    setup(startX, startY) {
      this.x = startX * this.tileSize;
      this.y = startY * this.tileSize;
    }
  
    // Update NPC position and pathfinding
    update() {
      if (this.path.length > 0) {
        this.followPath();
      } else {
        // Optional: Idle behavior or random movement
      }
    }
  
    // Follow the computed path
    followPath() {
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
      if (distance < 5) {
        this.path.shift(); // Reached the node, remove it from the path
      } else {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    }
  
    // Compute path to target using A* (called externally)
    setTarget(gridX, gridY) {
      const start = { 
        x: Math.floor(this.x / this.tileSize), 
        y: Math.floor(this.y / this.tileSize) 
      };
      const goal = { x: gridX, y: gridY };
      this.path = this.aStar(start, goal);
    }
  
    // A* Pathfinding Algorithm
    aStar(start, goal) {
      const openSet = [start];
      const cameFrom = {};
      const gScore = { [`${start.x},${start.y}`]: 0 };
      const fScore = { [`${start.x},${start.y}`]: this.heuristic(start, goal) };
  
      while (openSet.length > 0) {
        // Get node with lowest fScore
        const current = openSet.reduce((a, b) => 
          fScore[`${a.x},${a.y}`] < fScore[`${b.x},${b.y}`] ? a : b
        );
  
        // Reached goal
        if (current.x === goal.x && current.y === goal.y) {
          return this.reconstructPath(cameFrom, current);
        }
  
        // Remove current from openSet
        openSet.splice(openSet.indexOf(current), 1);
  
        // Check neighbors
        for (const neighbor of this.getNeighbors(current)) {
          const tentativeG = gScore[`${current.x},${current.y}`] + 1;
          const neighborKey = `${neighbor.x},${neighbor.y}`;
  
          if (!gScore[neighborKey] || tentativeG < gScore[neighborKey]) {
            cameFrom[neighborKey] = current;
            gScore[neighborKey] = tentativeG;
            fScore[neighborKey] = tentativeG + this.heuristic(neighbor, goal);
            if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
              openSet.push(neighbor);
            }
          }
        }
      }
      return []; // No path found
    }
  
    // Heuristic (Manhattan distance)
    heuristic(a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
  
    // Get walkable neighbors
    getNeighbors(node) {
      const directions = [
        { x: 0, y: -1 }, { x: 1, y: 0 }, 
        { x: 0, y: 1 }, { x: -1, y: 0 }
      ];
      const neighbors = [];
  
      for (const dir of directions) {
        const nx = node.x + dir.x;
        const ny = node.y + dir.y;
        const tileType = this.tileManager.getTileType(nx, ny);
        
        if (tileType !== 'tree') { // Assume 'tree' is an obstacle
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
      return path;
    }
  
    // Draw NPC
    draw() {
      fill(0, 255, 0); // Green for NPC
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