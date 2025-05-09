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
  background(0); // Clear the background
  game.update();
  game.draw();
  fill(255);
  text("FPS: " + Math.round(frameRate()), 20, 20);
}


function keyPressed() {
  // Check for map keyboard shortcuts first
  if (game.handleKeyboardShortcuts(key)) {
    return false; // Prevent default if handled
  }
  
  // Otherwise handle normal input
  game.handleInput();
}

function keyReleased() {
  game.handleKeyRelease();
}

function mousePressed() {
  // Check if the map handles the mouse press first
  if (game.handleMousePressed()) {
    return false; // Prevent default if handled
  }
  
  // Otherwise use standard click behavior
  const gridX = Math.floor(mouseX / game.tileSize);
  const gridY = Math.floor(mouseY / game.tileSize);
  game.setNPCTarget(gridX, gridY); // Set NPC target on click
}

function mouseMoved() {
  game.handleMouseMoved();
}

// Add window resize handler to ensure UI elements stay in correct positions
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}