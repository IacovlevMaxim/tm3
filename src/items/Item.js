class Item {
  constructor(x, y, type, tileSize) {
    this.gridX = x;
    this.gridY = y;
    this.type = type;
    this.tileSize = tileSize;
    this.isPickedUp = false;
    this.owner = null;
    this.offsetX = 20; // Offset from player when held
    this.offsetY = 0;
    this.color = this.getColorByType();
  }

  getColorByType() {
    switch (this.type) {
      case 'food': return [30, 100, 100]; // Orange
      case 'tool': return [200, 100, 100]; // Blue
      case 'wood': return [25, 70, 60]; // Brown
      case 'stone': return [0, 0, 70]; // Gray
      case 'metal': return [0, 0, 90]; // Silver
      default: return [280, 80, 100]; // Purple for other items
    }
  }

  draw() {
    push();
    strokeWeight(1);
    stroke(0);

    if (!this.isPickedUp) {
      // Draw the item on the ground
      // Position in the center of the tile
      const worldX = this.gridX * this.tileSize + this.tileSize / 2;
      const worldY = this.gridY * this.tileSize + this.tileSize / 2;
      this.drawItemShape(worldX, worldY);
    } else if (this.owner) {
      // Draw the item relative to the owner (from top-down view)
      // Note: offsetX and offsetY are set by the player based on facing direction
      this.drawItemShape(this.owner.x + this.tileSize / 2 + this.offsetX,
        this.owner.y + this.tileSize / 2 + this.offsetY);
    }
    pop();
  }

  drawItemShape(x, y) {
    fill(this.color[0], this.color[1], this.color[2]);

    const size = this.tileSize * 0.4; // Slightly smaller than tile

    if (this.type === 'food') {
      // Food is circular (apple, etc)
      ellipse(x, y, size);
    } else if (this.type === 'tool') {
      // Tools are T-shaped
      push();
      rectMode(CENTER);
      // Handle
      rect(x, y + size / 4, size / 4, size / 2);
      // Head
      rect(x, y - size / 4, size, size / 4);
      pop();
    } else if (this.type === 'wood') {
      // Wood is rectangular log
      push();
      rectMode(CENTER);
      rect(x, y, size, size / 2);
      // Wood grain lines
      stroke(0, 0, 40);
      line(x - size / 2 + 3, y - size / 6, x - size / 2 + 3, y + size / 6);
      line(x - size / 4, y - size / 6, x - size / 4, y + size / 6);
      line(x, y - size / 6, x, y + size / 6);
      line(x + size / 4, y - size / 6, x + size / 4, y + size / 6);
      pop();
    } else if (this.type === 'stone') {
      // Stone is rough edged oval
      push();
      beginShape();
      for (let i = 0; i < 8; i++) {
        const angle = i * TWO_PI / 8;
        const r = size / 2 * (0.8 + 0.2 * cos(angle * 3));
        vertex(x + r * cos(angle), y + r * sin(angle));
      }
      endShape(CLOSE);
      pop();
    } else {
      // Default item is a diamond shape
      push();
      beginShape();
      vertex(x, y - size / 2); // Top
      vertex(x + size / 2, y); // Right
      vertex(x, y + size / 2); // Bottom
      vertex(x - size / 2, y); // Left
      endShape(CLOSE);
      pop();
    }

    // Add a subtle shadow for better visibility on ground
    if (!this.isPickedUp) {
      noStroke();
      fill(0, 0, 0, 30);
      ellipse(x, y + size / 2, size * 0.8, size * 0.3);
    }
  }

  pickUp(character) {
    this.isPickedUp = true;
    this.owner = character;
    return true;
  }

  drop() {
    if (this.owner) {
      this.isPickedUp = false;
      this.owner = null;
    }
  }

  use() {
    // Implement item-specific usage behavior
    console.log(`Using ${this.type} item`);

    // Return true if the item should be consumed/removed after use
    return this.type === 'food';
  }
}
