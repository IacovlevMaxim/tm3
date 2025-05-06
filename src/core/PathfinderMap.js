class PathfinderMap {
    constructor(tileManager, tileSize) {
      this.tileManager = tileManager;
      this.tileSize = tileSize;
      this.visible = false;
      this.gridSize = 30; // Larger grid (30x30 instead of 20x20)
      this.startPos = { x: 0, y: 0 };
      this.targetPos = { x: 5, y: 5 };
      this.path = [];
      this.processedNodes = new Set(); // For visualization
      this.player = null; // Will be set in setup
      
      // UI parameters for main map
      this.mapX = 20;
      this.mapY = 20;
      this.cellSize = 16; // Slightly larger cells
      this.mapWidth = this.gridSize * this.cellSize;
      this.mapHeight = this.gridSize * this.cellSize;
      
      // Mini-map parameters
      this.miniMapVisible = true;
      this.miniMapSize = 150; // Size of mini-map
      this.miniMapCellSize = 4; // Size of cells in mini-map
      this.miniMapPadding = 10; // Padding from screen edge
      this.miniMapGridSize = Math.floor(this.miniMapSize / this.miniMapCellSize);
      
      // Button states
      this.startButtonActive = false;
      this.targetButtonActive = false;
      this.findButtonHover = false;
      this.closeButtonHover = false;
      this.followPathActive = false; // New state for following path
    }
    
    // Set reference to player
    setup(player) {
      this.player = player;
      // Initialize start position to player position
      this.updateStartPosition();
    }
    
    // Update start position to current player position
    updateStartPosition() {
      if (this.player) {
        this.startPos = { 
          x: Math.floor(this.player.x / this.tileSize), 
          y: Math.floor(this.player.y / this.tileSize) 
        };
        // Calculate path initially
        this.findPath();
      }
    }
    
    toggle() {
      this.visible = !this.visible;
      if (this.visible) {
        // Update start position to player position when showing
        this.updateStartPosition();
      }
    }
    
    toggleMiniMap() {
      this.miniMapVisible = !this.miniMapVisible;
    }
    
    // Draw the pathfinder map overlay
    draw() {
      if (this.visible) {
        // Draw full map
        this.drawFullMap();
      }
      
      // Always draw mini-map if enabled
      if (this.miniMapVisible) {
        this.drawMiniMap();
      }
    }
    
    drawFullMap() {
      push();
      resetMatrix(); // Draw in screen coordinates
      
      // Draw map background
      fill(0, 0, 0, 200);
      stroke(255);
      strokeWeight(2);
      rect(this.mapX, this.mapY, this.mapWidth + 120, this.mapHeight + 40);
      
      // Draw grid
      this.drawGrid();
      
      // Draw buttons
      this.drawButtons();
      
      // Draw legend
      this.drawLegend();
      
      pop();
    }
    
    drawGrid() {
      // Use player position as the center if available
      const centerX = Math.floor(this.startPos.x);
      const centerY = Math.floor(this.startPos.y);
      const halfSize = Math.floor(this.gridSize / 2);
      
      // Calculate grid bounds
      const startX = centerX - halfSize;
      const startY = centerY - halfSize;
      const endX = centerX + halfSize;
      const endY = centerY + halfSize;
      
      // Draw cells
      for (let y = 0; y < this.gridSize; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          const worldX = startX + x;
          const worldY = startY + y;
          const screenX = this.mapX + x * this.cellSize;
          const screenY = this.mapY + y * this.cellSize;
          
          // Get tile type at this position
          const tileType = this.tileManager.getTileType(worldX, worldY);
          
          // Set cell color based on tile type
          switch (tileType) {
            case 'water':
              fill(210, 70, 90); // Blue
              break;
            case 'sand':
              fill(40, 70, 90); // Tan
              break;
            case 'grass':
              fill(120, 70, 80); // Green
              break;
            case 'tree':
              fill(120, 90, 40); // Dark green
              break;
            default:
              fill(0, 0, 70); // Gray
          }
          
          // Draw the cell
          noStroke();
          rect(screenX, screenY, this.cellSize, this.cellSize);
          
          // Draw grid lines
          stroke(255, 50);
          strokeWeight(0.5);
          line(screenX, screenY, screenX + this.cellSize, screenY);
          line(screenX, screenY, screenX, screenY + this.cellSize);
        }
      }
      
      // Draw processed nodes (nodes visited during pathfinding)
      fill(250, 70, 70, 150); // Light orange
      noStroke();
      for (const nodeKey of this.processedNodes) {
        const [nx, ny] = nodeKey.split(',').map(Number);
        const localX = nx - startX;
        const localY = ny - startY;
        
        // Only draw if in our visible grid
        if (localX >= 0 && localX < this.gridSize && localY >= 0 && localY < this.gridSize) {
          rect(
            this.mapX + localX * this.cellSize + 3, 
            this.mapY + localY * this.cellSize + 3, 
            this.cellSize - 6, 
            this.cellSize - 6
          );
        }
      }
      
      // Draw path
      stroke(60, 100, 100); // Yellow
      strokeWeight(3);
      noFill();
      beginShape();
      for (const node of this.path) {
        const localX = node.x - startX;
        const localY = node.y - startY;
        
        // Only draw if in our visible grid
        if (localX >= 0 && localX < this.gridSize && localY >= 0 && localY < this.gridSize) {
          vertex(
            this.mapX + localX * this.cellSize + this.cellSize / 2, 
            this.mapY + localY * this.cellSize + this.cellSize / 2
          );
        }
      }
      endShape();
      
      // Draw start position
      fill(120, 100, 100); // Green
      stroke(255);
      strokeWeight(1);
      const startScreenX = this.mapX + (this.startPos.x - startX) * this.cellSize;
      const startScreenY = this.mapY + (this.startPos.y - startY) * this.cellSize;
      ellipse(
        startScreenX + this.cellSize / 2,
        startScreenY + this.cellSize / 2,
        this.cellSize * 0.8,
        this.cellSize * 0.8
      );
      
      // Draw target position
      fill(0, 100, 100); // Red
      const targetScreenX = this.mapX + (this.targetPos.x - startX) * this.cellSize;
      const targetScreenY = this.mapY + (this.targetPos.y - startY) * this.cellSize;
      ellipse(
        targetScreenX + this.cellSize / 2,
        targetScreenY + this.cellSize / 2,
        this.cellSize * 0.8,
        this.cellSize * 0.8
      );
      
      // Draw player position if different from start
      if (this.player) {
        const playerGridX = Math.floor(this.player.x / this.tileSize);
        const playerGridY = Math.floor(this.player.y / this.tileSize);
        
        if (playerGridX !== this.startPos.x || playerGridY !== this.startPos.y) {
          fill(270, 100, 100); // Purple
          const playerScreenX = this.mapX + (playerGridX - startX) * this.cellSize;
          const playerScreenY = this.mapY + (playerGridY - startY) * this.cellSize;
          
          // Only draw if in visible grid
          if (playerScreenX >= this.mapX && playerScreenX < this.mapX + this.mapWidth &&
              playerScreenY >= this.mapY && playerScreenY < this.mapY + this.mapHeight) {
            triangle(
              playerScreenX + this.cellSize / 2, playerScreenY,
              playerScreenX, playerScreenY + this.cellSize,
              playerScreenX + this.cellSize, playerScreenY + this.cellSize
            );
          }
        }
      }
    }
    
    drawMiniMap() {
      if (!this.miniMapVisible || this.path.length === 0) return;
      
      push();
      resetMatrix(); // Draw in screen coordinates
      
      // Calculate mini-map position (bottom right corner)
      const miniMapX = width - this.miniMapSize - this.miniMapPadding;
      const miniMapY = height - this.miniMapSize - this.miniMapPadding;
      
      // Draw mini-map background
      fill(0, 0, 0, 180);
      stroke(255);
      strokeWeight(1);
      rect(miniMapX, miniMapY, this.miniMapSize, this.miniMapSize);
      
      // Get player position
      let playerGridX = 0;
      let playerGridY = 0;
      if (this.player) {
        playerGridX = Math.floor(this.player.x / this.tileSize);
        playerGridY = Math.floor(this.player.y / this.tileSize);
      }
      
      // Calculate the range to display
      const halfGridSize = Math.floor(this.miniMapGridSize / 2);
      const startX = playerGridX - halfGridSize;
      const startY = playerGridY - halfGridSize;
      
      // Draw mini-grid (simplified - just important features)
      for (let y = 0; y < this.miniMapGridSize; y++) {
        for (let x = 0; x < this.miniMapGridSize; x++) {
          const worldX = startX + x;
          const worldY = startY + y;
          const screenX = miniMapX + x * this.miniMapCellSize;
          const screenY = miniMapY + y * this.miniMapCellSize;
          
          // Only draw obstacles and important features
          const tileType = this.tileManager.getTileType(worldX, worldY);
          
          if (tileType === 'water' || tileType === 'tree') {
            // Draw obstacles
            fill(tileType === 'water' ? color(210, 70, 90) : color(120, 90, 40));
            noStroke();
            rect(screenX, screenY, this.miniMapCellSize, this.miniMapCellSize);
          }
        }
      }
      
      // Draw path on mini-map
      stroke(60, 100, 100); // Yellow
      strokeWeight(2);
      noFill();
      beginShape();
      for (const node of this.path) {
        const localX = node.x - startX;
        const localY = node.y - startY;
        
        // Only draw if in our visible mini-map grid
        if (localX >= 0 && localX < this.miniMapGridSize && 
            localY >= 0 && localY < this.miniMapGridSize) {
          vertex(
            miniMapX + localX * this.miniMapCellSize + this.miniMapCellSize / 2, 
            miniMapY + localY * this.miniMapCellSize + this.miniMapCellSize / 2
          );
        }
      }
      endShape();
      
      // Draw target on mini-map
      const targetLocalX = this.targetPos.x - startX;
      const targetLocalY = this.targetPos.y - startY;
      
      if (targetLocalX >= 0 && targetLocalX < this.miniMapGridSize && 
          targetLocalY >= 0 && targetLocalY < this.miniMapGridSize) {
        fill(0, 100, 100); // Red
        noStroke();
        ellipse(
          miniMapX + targetLocalX * this.miniMapCellSize + this.miniMapCellSize / 2,
          miniMapY + targetLocalY * this.miniMapCellSize + this.miniMapCellSize / 2,
          this.miniMapCellSize * 1.5,
          this.miniMapCellSize * 1.5
        );
      }
      
      // Draw player position (always in center)
      fill(270, 100, 100); // Purple
      noStroke();
      const playerX = miniMapX + halfGridSize * this.miniMapCellSize;
      const playerY = miniMapY + halfGridSize * this.miniMapCellSize;
      triangle(
        playerX, playerY - this.miniMapCellSize,
        playerX - this.miniMapCellSize, playerY + this.miniMapCellSize,
        playerX + this.miniMapCellSize, playerY + this.miniMapCellSize
      );
      
      // Add mini-map controls
      if (this.followPathActive) {
        fill(60, 100, 100); // Yellow when active
      } else {
        fill(0, 0, 70); // Gray when inactive
      }
      stroke(255);
      strokeWeight(1);
      rect(miniMapX, miniMapY - 20, 80, 20, 5);
      
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      text("Follow Path", miniMapX + 40, miniMapY - 10);
      
      pop();
    }
    
    drawButtons() {
      const btnX = this.mapX + this.mapWidth + 10;
      const btnWidth = 100;
      const btnHeight = 30;
      
      // Draw "Set Start" button
      if (this.startButtonActive) {
        fill(120, 100, 70); // Darker green when active
      } else {
        fill(120, 80, 90); // Green
      }
      stroke(255);
      strokeWeight(1);
      rect(btnX, this.mapY + 10, btnWidth, btnHeight, 5);
      
      // Button text
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);
      text("Set Start", btnX + btnWidth / 2, this.mapY + 10 + btnHeight / 2);
      
      // Draw "Set Target" button
      if (this.targetButtonActive) {
        fill(0, 100, 70); // Darker red when active
      } else {
        fill(0, 80, 90); // Red
      }
      stroke(255);
      strokeWeight(1);
      rect(btnX, this.mapY + 50, btnWidth, btnHeight, 5);
      
      // Button text
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      text("Set Target", btnX + btnWidth / 2, this.mapY + 50 + btnHeight / 2);
      
      // Draw "Find Path" button
      if (this.findButtonHover) {
        fill(210, 100, 70); // Darker blue when hovered
      } else {
        fill(210, 80, 90); // Blue
      }
      stroke(255);
      strokeWeight(1);
      rect(btnX, this.mapY + 90, btnWidth, btnHeight, 5);
      
      // Button text
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      text("Find Path", btnX + btnWidth / 2, this.mapY + 90 + btnHeight / 2);
      
      // Draw "Use Current Pos" button
      fill(300, 80, 90); // Purple
      stroke(255);
      strokeWeight(1);
      rect(btnX, this.mapY + 130, btnWidth, btnHeight, 5);
      
      // Button text
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      text("Use Current Pos", btnX + btnWidth / 2, this.mapY + 130 + btnHeight / 2);
      
      // Draw "Follow Path" button
      if (this.followPathActive) {
        fill(60, 100, 70); // Darker yellow when active
      } else {
        fill(60, 80, 90); // Yellow
      }
      stroke(255);
      strokeWeight(1);
      rect(btnX, this.mapY + 170, btnWidth, btnHeight, 5);
      
      // Button text
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      text("Follow Path", btnX + btnWidth / 2, this.mapY + 170 + btnHeight / 2);
      
      // Draw "Toggle Mini-Map" button
      if (this.miniMapVisible) {
        fill(180, 80, 90); // Teal when on
      } else {
        fill(0, 0, 70); // Gray when off
      }
      stroke(255);
      strokeWeight(1);
      rect(btnX, this.mapY + 210, btnWidth, btnHeight, 5);
      
      // Button text
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      text("Toggle Mini-Map", btnX + btnWidth / 2, this.mapY + 210 + btnHeight / 2);
      
      // Draw "Close" button
      if (this.closeButtonHover) {
        fill(0, 0, 50); // Darker gray when hovered
      } else {
        fill(0, 0, 70); // Gray
      }
      stroke(255);
      strokeWeight(1);
      rect(btnX, this.mapY + this.mapHeight - 30, btnWidth, btnHeight, 5);
      
      // Button text
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      text("Close", btnX + btnWidth / 2, this.mapY + this.mapHeight - 30 + btnHeight / 2);
    }
    
    drawLegend() {
      const legendX = this.mapX + 10;
      const legendY = this.mapY + this.mapHeight + 10;
      const itemHeight = 20;
      const swatchSize = 15;
      
      textAlign(LEFT, CENTER);
      textSize(12);
      
      // Grid types
      fill(120, 70, 80); // Green
      noStroke();
      rect(legendX, legendY, swatchSize, swatchSize);
      fill(255);
      text("Grass", legendX + swatchSize + 5, legendY + swatchSize / 2);
      
      fill(210, 70, 90); // Blue
      rect(legendX + 70, legendY, swatchSize, swatchSize);
      fill(255);
      text("Water", legendX + 70 + swatchSize + 5, legendY + swatchSize / 2);
      
      fill(40, 70, 90); // Tan
      rect(legendX + 140, legendY, swatchSize, swatchSize);
      fill(255);
      text("Sand", legendX + 140 + swatchSize + 5, legendY + swatchSize / 2);
      
      fill(120, 90, 40); // Dark green
      rect(legendX + 210, legendY, swatchSize, swatchSize);
      fill(255);
      text("Tree", legendX + 210 + swatchSize + 5, legendY + swatchSize / 2);
      
      // Path elements
      fill(250, 70, 70, 150); // Processed nodes
      rect(legendX, legendY + itemHeight, swatchSize, swatchSize);
      fill(255);
      text("Visited", legendX + swatchSize + 5, legendY + itemHeight + swatchSize / 2);
      
      fill(0, 0, 0, 0); // Path
      stroke(60, 100, 100); // Yellow
      strokeWeight(3);
      line(legendX + 70, legendY + itemHeight + swatchSize / 2, 
           legendX + 70 + swatchSize, legendY + itemHeight + swatchSize / 2);
      fill(255);
      noStroke();
      text("Path", legendX + 70 + swatchSize + 5, legendY + itemHeight + swatchSize / 2);
      
      // Start and target
      fill(120, 100, 100); // Green
      stroke(255);
      strokeWeight(1);
      ellipse(legendX + 140 + swatchSize / 2, legendY + itemHeight + swatchSize / 2, swatchSize * 0.8, swatchSize * 0.8);
      fill(255);
      noStroke();
      text("Start", legendX + 140 + swatchSize + 5, legendY + itemHeight + swatchSize / 2);
      
      fill(0, 100, 100); // Red
      stroke(255);
      strokeWeight(1);
      ellipse(legendX + 210 + swatchSize / 2, legendY + itemHeight + swatchSize / 2, swatchSize * 0.8, swatchSize * 0.8);
      fill(255);
      noStroke();
      text("Target", legendX + 210 + swatchSize + 5, legendY + itemHeight + swatchSize / 2);
      
      // Player position
      fill(270, 100, 100); // Purple
      stroke(255);
      strokeWeight(1);
      triangle(
        legendX + 280 + swatchSize / 2, legendY + itemHeight,
        legendX + 280, legendY + itemHeight + swatchSize,
        legendX + 280 + swatchSize, legendY + itemHeight + swatchSize
      );
      fill(255);
      noStroke();
      text("Player", legendX + 280 + swatchSize + 5, legendY + itemHeight + swatchSize / 2);
    }
    
    // Handle mouse interaction
    handleMousePressed() {
      if (!this.visible && !this.miniMapVisible) return false;
      
      // Handle mini-map interactions if visible
      if (this.miniMapVisible) {
        const miniMapX = width - this.miniMapSize - this.miniMapPadding;
        const miniMapY = height - this.miniMapSize - this.miniMapPadding;
        
        // Check if clicking on "Follow Path" toggle on mini-map
        if (mouseX >= miniMapX && mouseX <= miniMapX + 80 &&
            mouseY >= miniMapY - 20 && mouseY <= miniMapY) {
          this.followPathActive = !this.followPathActive;
          return true;
        }
      }
      
      // If the main map isn't visible, we're done checking
      if (!this.visible) return false;
      
      const btnX = this.mapX + this.mapWidth + 10;
      const btnWidth = 100;
      const btnHeight = 30;
      
      // Check if clicking on "Set Start" button
      if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
          mouseY >= this.mapY + 10 && mouseY <= this.mapY + 10 + btnHeight) {
        this.startButtonActive = true;
        this.targetButtonActive = false;
        return true;
      }
      
      // Check if clicking on "Set Target" button
      if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
          mouseY >= this.mapY + 50 && mouseY <= this.mapY + 50 + btnHeight) {
        this.targetButtonActive = true;
        this.startButtonActive = false;
        return true;
      }
      
      // Check if clicking on "Find Path" button
      if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
          mouseY >= this.mapY + 90 && mouseY <= this.mapY + 90 + btnHeight) {
        this.findPath();
        return true;
      }
      
      // Check if clicking on "Use Current Pos" button
      if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
          mouseY >= this.mapY + 130 && mouseY <= this.mapY + 130 + btnHeight) {
        this.updateStartPosition();
        return true;
      }
      
      // Check if clicking on "Follow Path" button
      if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
          mouseY >= this.mapY + 170 && mouseY <= this.mapY + 170 + btnHeight) {
        this.followPathActive = !this.followPathActive;
        return true;
      }
      
      // Check if clicking on "Toggle Mini-Map" button
      if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
          mouseY >= this.mapY + 210 && mouseY <= this.mapY + 210 + btnHeight) {
        this.toggleMiniMap();
        return true;
      }
      
      // Check if clicking on "Close" button
      if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
          mouseY >= this.mapY + this.mapHeight - 30 && mouseY <= this.mapY + this.mapHeight - 30 + btnHeight) {
        this.visible = false;
        return true;
      }
      
      // Check if clicking on grid
      if (mouseX >= this.mapX && mouseX <= this.mapX + this.mapWidth &&
          mouseY >= this.mapY && mouseY <= this.mapY + this.mapHeight) {
        
        // Calculate which cell was clicked
        const cellX = Math.floor((mouseX - this.mapX) / this.cellSize);
        const cellY = Math.floor((mouseY - this.mapY) / this.cellSize);
        
        // Convert to world coordinates
        const halfSize = Math.floor(this.gridSize / 2);
        const centerX = Math.floor(this.startPos.x);
        const centerY = Math.floor(this.startPos.y);
        const worldX = centerX - halfSize + cellX;
        const worldY = centerY - halfSize + cellY;
        
        // Update start or target position based on active button
        if (this.startButtonActive) {
          this.startPos = { x: worldX, y: worldY };
          this.findPath();
        } else if (this.targetButtonActive) {
          this.targetPos = { x: worldX, y: worldY };
          this.findPath();
        }
        
        return true;
      }
      
      return false;
    }
    
    // Handle mouse movement for button hover effects
    handleMouseMoved() {
      if (!this.visible) return false;
      
      const btnX = this.mapX + this.mapWidth + 10;
      const btnWidth = 100;
      const btnHeight = 30;
      
      // Check if hovering over "Find Path" button
      this.findButtonHover = (
        mouseX >= btnX && mouseX <= btnX + btnWidth &&
        mouseY >= this.mapY + 90 && mouseY <= this.mapY + 90 + btnHeight
      );
      
      // Check if hovering over "Close" button
      this.closeButtonHover = (
        mouseX >= btnX && mouseX <= btnX + btnWidth &&
        mouseY >= this.mapY + this.mapHeight - 30 && mouseY <= this.mapY + this.mapHeight - 30 + btnHeight
      );
      
      return this.findButtonHover || this.closeButtonHover;
    }
    
    // Check if we should update the dog to follow the path
    isFollowingPath() {
      return this.followPathActive && this.path.length > 0;
    }
    
    // Get the next target position for the NPC to follow
    getNextPathTarget() {
        if (!this.isFollowingPath() || this.path.length === 0) {
          return null;
        }
        
        // Get player's current grid position
        const playerGridX = Math.floor(this.player.x / this.tileSize);
        const playerGridY = Math.floor(this.player.y / this.tileSize);
        
        // Find the closest point on the path to the player
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.path.length; i++) {
          const pathNode = this.path[i];
          const distance = Math.abs(pathNode.x - playerGridX) + 
                           Math.abs(pathNode.y - playerGridY);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
          }
        }
        
        // Get the next node on the path after the closest one
        const nextIndex = closestIndex + 1;
        
        if (nextIndex < this.path.length) {
          return this.path[nextIndex];
        } else if (this.path.length > 0) {
          // If we're at the end of the path, return the target
          return this.targetPos;
        }
        
        return null;
      }
    
    // Find path using Dijkstra's algorithm and record processed nodes for visualization
    findPath() {
      // Initialize data structures
      const openSet = [];
      const closedSet = new Set();
      const gScore = {};
      const cameFrom = {};
      this.processedNodes = new Set(); // Reset processed nodes
      
      // Set initial values
      gScore[`${this.startPos.x},${this.startPos.y}`] = 0;
      openSet.push(this.startPos);
      
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
        
        // Add to processed nodes for visualization
        this.processedNodes.add(`${current.x},${current.y}`);
        
        // If we reached the goal
        if (current.x === this.targetPos.x && current.y === this.targetPos.y) {
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
      return path;
    }
  }