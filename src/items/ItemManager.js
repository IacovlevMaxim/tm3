class ItemManager {
  constructor(tileSize) {
    this.items = [];
    this.tileSize = tileSize;
  }

  addItem(x, y, type) {
    const item = new Item(x, y, type, this.tileSize);
    this.items.push(item);
    return item;
  }

  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  getItemAt(gridX, gridY) {
    return this.items.find(item =>
      !item.isPickedUp &&
      Math.round(item.gridX) === gridX &&
      Math.round(item.gridY) === gridY
    );
  }

  getItemsInRadius(centerX, centerY, gridRadius) {
    // Get all items within a certain grid radius of a point
    return this.items.filter(item => {
      if (item.isPickedUp) return false;

      const dx = item.gridX - centerX;
      const dy = item.gridY - centerY;
      return Math.sqrt(dx * dx + dy * dy) <= gridRadius;
    });
  }

  draw() {
    // Draw all items
    for (const item of this.items) {
      item.draw();
    }
  }
}
