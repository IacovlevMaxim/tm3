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
    this.npc = new NPC(this.tileSize, this.tileManager, this.player); // Initialize NPC
  }

  setup() {
    colorMode(HSB);
    textFont('monospace');
    this.player.setup();
    this.npc.setup(5, 5); // Set NPC's starting position (grid coordinates)
  }

  draw() {
    background(135, 50, 90);
    this.player.update();
    this.npc.update(); // Update NPC
    
    push();
    this.player.applyCameraTransform();
    this.tileManager.draw(this.player.x, this.player.y);
    this.player.draw();
    this.npc.draw(); // Draw NPC
    pop();
  }
  setNPCTarget(gridX, gridY) {
    this.npc.setTarget(gridX, gridY);
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