class Player {
    constructor(tileSize, tileManager) {
        this.tileSize = tileSize;
        this.tileManager = tileManager;
        this.x = 0;
        this.y = 0;
        this.velocity = { x: 0, y: 0 };
        this.speed = 0;
        this.maxSpeed = 5;
        this.acceleration = 0.2;
        this.deceleration = 0.2;
        this.direction = { x: 0, y: 0 };
        this.lastNonZeroDirection = { x: 0, y: 1 }
        this.facing = { x: 0, y: 1 }; // Default facing down
    }

    setup() {
        this.x = 0;
        this.y = 0;
    }

    update() {
        // Apply velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Grid-aligned collision detection
        this.checkCollisions();
        this.handleInput();
    }

    checkCollisions() {
        const gridX = Math.round(this.x / this.tileSize);
        const gridY = Math.round(this.y / this.tileSize);
        const surroundings = this.getSurroundings();

        // Check all adjacent tiles that we might be overlapping with
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tile = surroundings[dy + 1][dx + 1];
                if (!tile || !tile.isObstacle) continue;

                // Check if player is overlapping with this obstacle tile
                const tileLeft = tile.worldX;
                const tileRight = tile.worldX + this.tileSize;
                const tileTop = tile.worldY;
                const tileBottom = tile.worldY + this.tileSize;

                const playerLeft = this.x;
                const playerRight = this.x + this.tileSize;
                const playerTop = this.y;
                const playerBottom = this.y + this.tileSize;

                // Simple AABB collision detection
                if (playerRight > tileLeft && playerLeft < tileRight &&
                    playerBottom > tileTop && playerTop < tileBottom) {
                    
                    // Calculate push-out direction
                    const overlapX = Math.min(
                        playerRight - tileLeft,
                        tileRight - playerLeft
                    );
                    const overlapY = Math.min(
                        playerBottom - tileTop,
                        tileBottom - playerTop
                    );

                    // Push out in the direction of least overlap
                    if (overlapX < overlapY) {
                        if (this.velocity.x > 0) {
                            this.x = tileLeft - this.tileSize;
                        } else if (this.velocity.x < 0) {
                            this.x = tileRight;
                        }
                    } else {
                        if (this.velocity.y > 0) {
                            this.y = tileTop - this.tileSize;
                        } else if (this.velocity.y < 0) {
                            this.y = tileBottom;
                        }
                    }

                    // Stop velocity in collision direction
                    if (overlapX < overlapY) {
                        this.velocity.x = 0;
                    } else {
                        this.velocity.y = 0;
                    }
                }
            }
        }
    }

    handleKeyRelease() {
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    handleInput() {
        // Store previous direction before updating
        const prevDirection = { ...this.direction };
        
        // Reset direction
        this.direction.x = 0;
        this.direction.y = 0;

        // Get input direction
        if (keyIsDown(87) || keyIsDown(UP_ARROW)) this.direction.y = -1;
        if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) this.direction.y = 1;
        if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) this.direction.x = -1;
        if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) this.direction.x = 1;

        // Update last non-zero direction if we have input
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            this.lastNonZeroDirection = { ...this.direction };
        }

        // Normalize diagonal movement
        if (this.direction.x !== 0 && this.direction.y !== 0) {
            const len = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
            this.direction.x /= len;
            this.direction.y /= len;
        }

        // Update facing direction if moving
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            this.facing = { ...this.direction };
        }

        // Apply acceleration/deceleration
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            // Accelerate in current direction
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        } else {
            // Decelerate but maintain last movement direction
            this.speed = Math.max(this.speed - this.deceleration, 0);
        }

        // Update velocity - use last direction when decelerating
        const activeDirection = (this.direction.x !== 0 || this.direction.y !== 0) 
            ? this.direction 
            : this.lastNonZeroDirection;
            
        this.velocity.x = activeDirection.x * this.speed;
        this.velocity.y = activeDirection.y * this.speed;
    }

    // ... (rest of the class remains the same)
    

    getSurroundings() {
        const surroundings = [[], [], []]; // 3x3 array
        const playerGridX = Math.round(this.x / this.tileSize);
        const playerGridY = Math.round(this.y / this.tileSize);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const gridX = playerGridX + dx;
                const gridY = playerGridY + dy;
                
                // Get tile type and world coordinates
                const tileType = this.tileManager.getTileType(gridX, gridY);
                const worldX = gridX * this.tileSize;
                const worldY = gridY * this.tileSize;
                
                // Create a tile object with relevant information
                surroundings[dy + 1][dx + 1] = {
                    type: tileType,
                    gridX: gridX,
                    gridY: gridY,
                    worldX: worldX,
                    worldY: worldY,
                    isObstacle: tileType === 'tree' // Can be expanded with other obstacles
                };
            }
        }
        
        return surroundings;
    }

    applyCameraTransform() {
        translate(width / 2 - this.x, height / 2 - this.y);
    }

    draw() {
        fill(0);
        // Draw player facing direction
        if (this.facing.x !== 0 || this.facing.y !== 0) {
            // Add visual indicator for facing direction
            fill(255, 0, 0);
            triangle(
                this.x + this.tileSize/2, this.y + this.tileSize/2,
                this.x + this.tileSize/2 + this.facing.x * 20, this.y + this.tileSize/2 + this.facing.y * 20,
                this.x + this.tileSize/2 + this.facing.y * 10, this.y + this.tileSize/2 - this.facing.x * 10
            );
        }
        fill(0);
        rect(this.x, this.y, this.tileSize, this.tileSize);
    }
}