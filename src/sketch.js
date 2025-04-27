let game;

function preload() {
  game = new Game();
  game.preload();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  game.setup();
}

function draw() {
  game.draw();
  game.update();
}

function keyPressed() {
  game.handleInput();
}

function keyReleased() {
    game.handleKeyRelease();
}

function mousePressed() {
  const gridX = Math.floor(mouseX / game.tileSize);
  const gridY = Math.floor(mouseY / game.tileSize);
  game.setNPCTarget(gridX, gridY); // Set NPC target on click
}