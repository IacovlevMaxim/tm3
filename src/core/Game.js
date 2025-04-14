class Game {
  constructor() {
    this.tileSize = 50;
    this.player = null;
    this.tileManager = null;
  }

  preload() {
    this.tileManager = new TileManager(this.tileSize);
    this.tileManager.preload();
    this.player = new Player(this.tileSize, this.tileManager);
  }

  setup() {
    colorMode(HSB);
    textFont('monospace');
    this.player.setup();
  }

  draw() {
    background(135, 50, 90);
    this.player.update();
    
    push();
    this.player.applyCameraTransform();
    this.tileManager.draw(this.player.x, this.player.y);
    this.player.draw();
    pop();
  }

  update() {
    this.player.update();
  }

  handleKeyRelease() {
    this.player.handleKeyRelease();
  }

  handleInput() {
    this.player.handleInput();
  }
}