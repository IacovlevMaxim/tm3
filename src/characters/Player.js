class Player {
    constructor(tileSize, tileManager, itemManager) {
        this.tileSize = tileSize;
        this.tileManager = tileManager;
        this.itemManager = itemManager; // Add item manager reference
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

        // Inventory system
        this.inventory = [];
        this.maxInventorySize = 5;
        this.equippedItemIndex = -1; // -1 means no item equipped

        // Item interaction cooldown
        this.interactionCooldown = 0;
        this.cooldownDuration = 15; // Frames
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

        // Update interaction cooldown
        if (this.interactionCooldown > 0) {
            this.interactionCooldown--;
        }

        // Update equipped item position if we have one
        if (this.equippedItemIndex !== -1 && this.inventory[this.equippedItemIndex]) {
            this.updateEquippedItemPosition();
        }
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
        // Keep original functionality
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

        // Check for item interactions
        if (keyIsDown(69) && this.interactionCooldown <= 0) { // E key
            if (this.equippedItemIndex === -1) {
                this.pickUpItem();
            } else {
                this.dropItem();
            }
            this.interactionCooldown = this.cooldownDuration;
        }

        if (keyIsDown(70) && this.interactionCooldown <= 0) { // F key
            this.useItem();
            this.interactionCooldown = this.cooldownDuration;
        }

        // Inventory selection with number keys 1-5
        for (let i = 49; i <= 53; i++) { // Keys 1-5
            if (keyIsDown(i)) {
                const index = i - 49;
                this.selectItem(index);
                break;
            }
        }
    }

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
        // Draw player facing direction
        if (this.facing.x !== 0 || this.facing.y !== 0) {
            // Add visual indicator for facing direction
            fill(255, 0, 0);
            triangle(
                this.x + this.tileSize / 2, this.y + this.tileSize / 2,
                this.x + this.tileSize / 2 + this.facing.x * 20, this.y + this.tileSize / 2 + this.facing.y * 20,
                this.x + this.tileSize / 2 + this.facing.y * 10, this.y + this.tileSize / 2 - this.facing.x * 10
            );
        }
        fill(0);
        rect(this.x, this.y, this.tileSize, this.tileSize);

        // Draw inventory after camera reset (in the Game.draw method)
    }

    drawInventory() {
        // Reset transformation to draw on screen coordinates
        push();
        resetMatrix();

        // Draw inventory background
        fill(0, 0, 20, 0.7);
        rect(10, height - 70, 50 * this.maxInventorySize + 20, 60);

        // Draw inventory slots
        for (let i = 0; i < this.maxInventorySize; i++) {
            if (i === this.equippedItemIndex) {
                // Highlight equipped item
                stroke(60, 100, 100);
                strokeWeight(3);
            } else {
                stroke(0);
                strokeWeight(1);
            }

            fill(0, 0, 30);
            rect(20 + i * 50, height - 60, 40, 40);

            // Draw item in slot if exists
            if (i < this.inventory.length) {
                const item = this.inventory[i];

                // Draw mini version of the item in inventory slot
                push();
                translate(20 + i * 50 + 20, height - 60 + 20);
                scale(0.6); // Scale down for inventory

                // Use item's color
                fill(item.color[0], item.color[1], item.color[2]);
                stroke(0);
                strokeWeight(1);

                // Draw simple icons based on item type
                if (item.type === 'food') {
                    ellipse(0, 0, 25);
                } else if (item.type === 'tool') {
                    // T-shape
                    rect(0, 5, 5, 15);
                    rect(0, -5, 20, 5);
                } else if (item.type === 'wood') {
                    rect(0, 0, 25, 12);
                } else if (item.type === 'stone') {
                    beginShape();
                    for (let j = 0; j < 8; j++) {
                        const angle = j * TWO_PI / 8;
                        const r = 12 * (0.8 + 0.2 * cos(angle * 3));
                        vertex(r * cos(angle), r * sin(angle));
                    }
                    endShape(CLOSE);
                } else {
                    // Diamond shape for other items
                    quad(0, -12, 12, 0, 0, 12, -12, 0);
                }
                pop();
            }

            // Draw slot number
            fill(255);
            noStroke();
            textSize(10);
            text(i + 1, 20 + i * 50 + 5, height - 60 + 15);
        }

        // Draw inventory instructions
        fill(255);
        textSize(12);
        text("E: Pick up/Drop | F: Use | 1-5: Select", 20, height - 15);

        pop();
    }

    // New inventory and item interaction methods

    pickUpItem() {
        // Calculate grid position
        const gridX = Math.round(this.x / this.tileSize);
        const gridY = Math.round(this.y / this.tileSize);

        // First check current cell for items
        let item = this.itemManager.getItemAt(gridX, gridY);

        // If no item found, check in front of the player based on facing direction
        if (!item) {
            const frontGridX = Math.round(this.x / this.tileSize + this.facing.x);
            const frontGridY = Math.round(this.y / this.tileSize + this.facing.y);
            item = this.itemManager.getItemAt(frontGridX, frontGridY);
        }

        // If item found and inventory has space, pick it up
        if (item && this.inventory.length < this.maxInventorySize) {
            item.pickUp(this);
            this.inventory.push(item);
            this.equippedItemIndex = this.inventory.length - 1;
            this.updateEquippedItemPosition();
            return true;
        }

        return false;
    }

    dropItem() {
        if (this.equippedItemIndex !== -1 && this.equippedItemIndex < this.inventory.length) {
            const item = this.inventory[this.equippedItemIndex];

            // Drop in front of player based on facing direction
            const dropGridX = Math.round(this.x / this.tileSize + this.facing.x);
            const dropGridY = Math.round(this.y / this.tileSize + this.facing.y);

            // Check if the destination tile is walkable before dropping
            const tileType = this.tileManager.getTileType(dropGridX, dropGridY);
            if (tileType !== 'tree' && tileType !== 'water') { // Add other unwalkable tiles as needed
                item.gridX = dropGridX;
                item.gridY = dropGridY;
                item.drop();
                this.inventory.splice(this.equippedItemIndex, 1);

                // Adjust equipped item index
                if (this.inventory.length === 0) {
                    this.equippedItemIndex = -1;
                } else if (this.equippedItemIndex >= this.inventory.length) {
                    this.equippedItemIndex = this.inventory.length - 1;
                }

                return true;
            }
        }

        return false;
    }

    useItem() {
        if (this.equippedItemIndex !== -1 && this.equippedItemIndex < this.inventory.length) {
            const item = this.inventory[this.equippedItemIndex];
            const consumed = item.use();

            if (consumed) {
                this.inventory.splice(this.equippedItemIndex, 1);
                this.itemManager.removeItem(item);

                // Adjust equipped item index
                if (this.inventory.length === 0) {
                    this.equippedItemIndex = -1;
                } else if (this.equippedItemIndex >= this.inventory.length) {
                    this.equippedItemIndex = this.inventory.length - 1;
                }
            }

            return true;
        }

        return false;
    }

    selectItem(index) {
        if (index < this.inventory.length) {
            if (this.equippedItemIndex === index) {
                // Deselect if already selected
                this.equippedItemIndex = -1;
            } else {
                this.equippedItemIndex = index;
                this.updateEquippedItemPosition();
            }
            return true;
        }

        return false;
    }

    updateEquippedItemPosition() {
        const item = this.inventory[this.equippedItemIndex];

        // Set item offset based on facing direction
        if (this.facing.x > 0) { // Right
            item.offsetX = this.tileSize * 0.8;
            item.offsetY = 0;
        } else if (this.facing.x < 0) { // Left
            item.offsetX = -this.tileSize * 0.8;
            item.offsetY = 0;
        } else if (this.facing.y < 0) { // Up
            item.offsetX = 0;
            item.offsetY = -this.tileSize * 0.8;
        } else if (this.facing.y > 0) { // Down
            item.offsetX = 0;
            item.offsetY = this.tileSize * 0.8;
        }
    }
}
