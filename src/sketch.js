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