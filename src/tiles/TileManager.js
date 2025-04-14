class TileManager {
    constructor(tileSize) {
      this.tileSize = tileSize;
      this.noiseScale = 0.1;
      this.images = [];
    }
  
    preload() {
      this.images.push(loadImage('assets/water.png')); // index 0 - water
      this.images.push(loadImage('assets/sand.png'));  // index 1 - sand
      this.images.push(loadImage('assets/grass.png')); // index 2 - grass
    }
  
    getTileType(tileX, tileY) {
      let v = noise(tileX * this.noiseScale, tileY * this.noiseScale);
      if (v <= 0.4) return 'water';
      else if (v <= 0.5) return 'sand';
      else if (v <= 0.7) return 'grass';
      else return 'tree';
    }
  
    draw(playerX, playerY) {
        const leftBound   = playerX - width / 2;
        const rightBound  = playerX + width / 2;
        const topBound    = playerY - height / 2;
        const bottomBound = playerY + height / 2;
        
        const extraBuffer = 2;
        const xStart = Math.floor(leftBound / this.tileSize) - extraBuffer;
        const xEnd   = Math.floor(rightBound / this.tileSize) + extraBuffer;
        const yStart = Math.floor(topBound / this.tileSize) - extraBuffer;
        const yEnd   = Math.floor(bottomBound / this.tileSize) + extraBuffer;
        
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
      
      if (type === 'tree') {
        fill(34, 100, 40);
        textAlign(CENTER, CENTER);
        textSize(this.tileSize);
        text('t', sx + this.tileSize / 2, sy + this.tileSize / 2);
      } else {
        let imgIndex;
        if (type === 'water') imgIndex = 0;
        else if (type === 'sand') imgIndex = 1;
        else if (type === 'grass') imgIndex = 2;
        
        image(this.images[imgIndex], sx, sy, this.tileSize, this.tileSize);
        
        let bushNoise = noise((tileX + 100) * this.noiseScale, (tileY + 100) * this.noiseScale);
        if (bushNoise > 0.55 && bushNoise < 0.60 && type === 'grass') {
          fill(0);
          textAlign(CENTER, BOTTOM);
          textSize(12); 
          text("b", sx + this.tileSize / 2, sy);
        }
      }
    }
  }