class Tile {
    constructor(x, y, tileSize, image) {
      this.x = x;
      this.y = y;
      this.tileSize = tileSize;
      this.image = image;
    }
  
    draw() {
      image(this.image, this.x * this.tileSize, this.y * this.tileSize, 
            this.tileSize, this.tileSize);
    }
  
    // Common tile methods
}