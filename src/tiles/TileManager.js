class TileManager {
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.noiseScale = 0.1;
    this.images = [];
  }

  preload() {
    const paths = [
      'assets/water.png',  // 0
      'assets/sand.png',   // 1
      'assets/grass.png',  // 2
      'assets/tree.png',   // 3
    ];
    this.images = paths.map(path => loadImage(path));
  }

  getTileType(tileX, tileY) {
    const v = noise(tileX * this.noiseScale, tileY * this.noiseScale);
    if (v <= 0.4) return 'water';
    if (v <= 0.5) return 'sand';
    if (v <= 0.7) return 'grass';
    return 'tree';
  }

  draw(playerX, playerY) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const extraBuffer = 2;
    const xStart = Math.floor((playerX - halfWidth) / this.tileSize) - extraBuffer;
    const xEnd   = Math.floor((playerX + halfWidth) / this.tileSize) + extraBuffer;
    const yStart = Math.floor((playerY - halfHeight) / this.tileSize) - extraBuffer;
    const yEnd   = Math.floor((playerY + halfHeight) / this.tileSize) + extraBuffer;

    for (let x = xStart; x <= xEnd; x++) {
      for (let y = yStart; y <= yEnd; y++) {
        this.drawTile(x, y);
      }
    }
  }

  drawTile(tileX, tileY) {
    const type = this.getTileType(tileX, tileY);
    const sx = tileX * this.tileSize;
    const sy = tileY * this.tileSize;

    const typeToIndex = {
      'water': 0,
      'sand': 1,
      'grass': 2,
      'tree': 3
    };

    const imgIndex = typeToIndex[type];

    if (imgIndex === undefined || !this.images[imgIndex]) return;

    image(this.images[imgIndex], sx, sy, this.tileSize, this.tileSize);

    // Добавление кустов на траве по шуму
    if (type === 'grass') {
      const bushNoise = noise((tileX + 100) * this.noiseScale, (tileY + 100) * this.noiseScale);
      if (bushNoise > 0.55 && bushNoise < 0.60) {
        fill(0);
        textAlign(CENTER, BOTTOM);
        textSize(12); 
        text("b", sx + this.tileSize / 2, sy);
      }
    }
  }
}
