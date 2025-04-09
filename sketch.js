const tileSize = 50;
const noiseScale = 0.1;
const images = []; 

// Time for movement animation in ms
const delayNormal = 200; 
const delayWater = 500;

// Player: using smooth movement between target positions
let playerX = 0; // current world coordinate X
let playerY = 0; // current world coordinate Y

// Movement state
let moving = false;
let moveStart = { x: 0, y: 0 };
let moveTarget = { x: 0, y: 0 };
let moveStartTime = 0;
let moveDuration = delayNormal;

function preload() {
  images.push(loadImage('assets/water.png')); // index 0 — water
  images.push(loadImage('assets/sand.png'));  // index 1 — sand
  images.push(loadImage('assets/grass.png')); // index 2 — grass
  // Для деревьев отдельного изображения пока нет – будем рисовать символ "t"
}

function setup() {
  createCanvas(1550, 1000);
  noStroke();
  colorMode(HSB);
  textFont('monospace');
  // Initially the player is exactly aligned to the grid (starting coordinates are multiples of tileSize)
  playerX = 0;
  playerY = 0;
}

function draw() {
  background(135, 50, 90);
  
  update();
  
  // Use camera transformation to ensure the player is always centered on the screen
  push();
  translate(width / 2 - playerX, height / 2 - playerY);
  drawTerrain();
  
  // Draw the player – draw a rectangle; its position equals the current (smoothed) position
  fill(0);
  rect(playerX, playerY, tileSize, tileSize);              //!!!!!!!!!!!!!!!!!!!!!!!!!!! Сюда ставьте ассет нашего древнего руса
  pop();
}

// State update function: if the player is moving, update interpolation;
// otherwise, process input to begin new movement.
function update() {
  let currentTime = millis();
  
  if (moving) {
    // Calculate progress of movement from 0 to 1
    let t = (currentTime - moveStartTime) / moveDuration;
    if (t >= 1) {
      // Movement complete: set final position and reset movement state
      playerX = moveTarget.x;
      playerY = moveTarget.y;
      moving = false;
    } else {
      // Interpolate the position
      playerX = lerp(moveStart.x, moveTarget.x, t);
      playerY = lerp(moveStart.y, moveTarget.y, t);
    }
  } else {
    // If the player is not moving, check which keys are pressed
    let dx = 0, dy = 0;
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) {  // W or up arrow
      dy = -1;
    }
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { // S or down arrow
      dy = 1;
    }
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { // A or left arrow
      dx = -1;
    }
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { // D or right arrow
      dx = 1;
    }
    
    if (dx !== 0 || dy !== 0) {
      // Compute target coordinates (movement exactly one tile)
      const nextX = round(playerX / tileSize) * tileSize + dx * tileSize;
      const nextY = round(playerY / tileSize) * tileSize + dy * tileSize;
      
      // Determine the type of the target tile
      const destTileX = nextX / tileSize;
      const destTileY = nextY / tileSize;
      const destTileType = getTileType(destTileX, destTileY);
      
      // !!!!!!!!!!!!!!!!!!!    Сейчас чел проходить через дерево не может, создайте чтобы он добывал древо
      if (destTileType === 'tree') {
        return;
      }
      
      // Initialize smooth movement: store starting position, target, and start time
      moving = true;
      moveStartTime = currentTime;
      moveStart = { x: playerX, y: playerY };
      moveTarget = { x: nextX, y: nextY };
      
      // Choose movement duration based on terrain type
      moveDuration = (destTileType === 'water') ? delayWater : delayNormal;
    }
  }
}

// Draw the map: only render tiles that are in the visible area (+ a small buffer)
function drawTerrain() {
  // Screen boundaries in world coordinates
  const leftBound   = playerX - width / 2;
  const rightBound  = playerX + width / 2;
  const topBound    = playerY - height / 2;
  const bottomBound = playerY + height / 2;
  
  const extraBuffer = 2;
  const xStart = Math.floor(leftBound / tileSize) - extraBuffer;
  const xEnd   = Math.floor(rightBound / tileSize) + extraBuffer;
  const yStart = Math.floor(topBound / tileSize) - extraBuffer;
  const yEnd   = Math.floor(bottomBound / tileSize) + extraBuffer;
  
  for (let x = xStart; x <= xEnd; x++) {
    for (let y = yStart; y <= yEnd; y++) {
      drawTile(x, y);
    }
  }
}

// This function returns the tile type based on its coordinates using noise
function getTileType(tileX, tileY) {
  let v = noise(tileX * noiseScale, tileY * noiseScale);
  if (v <= 0.4) {
    return 'water';  // Water
  } else if (v <= 0.5) {
    return 'sand';   // Sand
  } else if (v <= 0.7) {
    return 'grass';  // Grass
  } else {
    return 'tree';   // Tree – for now we draw the letter "t"
  }
}

// Function that draws a single tile based on its type. On tiles with grass, display the text "b-bush" over the image
function drawTile(tileX, tileY) {
  const type = getTileType(tileX, tileY);
  const sx = tileX * tileSize;
  const sy = tileY * tileSize;
  
  if (type === 'tree') {
    // Draw the letter "t" – marking where trees will be generated
    fill(34, 100, 40);
    textAlign(CENTER, CENTER);
    textSize(tileSize);
    text('t', sx + tileSize / 2, sy + tileSize / 2);
  } else {
    // Draw the image for other types
    let imgIndex;
    if (type === 'water') {
      imgIndex = 0;
    } else if (type === 'sand') {
      imgIndex = 1;
    } else if (type === 'grass') {
      imgIndex = 2;
    }
    image(images[imgIndex], sx, sy, tileSize, tileSize);
    
    // If the tile is grass – add the text "b" on some tiles
    // Use offset noise for deterministic bush placement
    let bushNoise = noise((tileX + 100) * noiseScale, (tileY + 100) * noiseScale);
    if (bushNoise > 0.55 && bushNoise < 0.60 && type === 'grass') {
      fill(0);
      textAlign(CENTER, BOTTOM);
      textSize(12); 
      text("b", sx + tileSize / 2, sy);     //!!!!!!!!!!!!! сюда ставьте кустов ассеты
    }
  }
}
