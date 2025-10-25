// Phaser 3 Adventure - Classic Green Platform Version

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Minimal assets (simple colors)
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/block.png');
    this.load.spritesheet('player', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('coin', 'https://labs.phaser.io/assets/sprites/coin.png');
    this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/red_ball.png');
    this.load.image('portal', 'https://labs.phaser.io/assets/sprites/blue_ball.png');
  }

  create() {
    this.scene.start('Level1');
  }
}

// ---- Player ----
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.jumps = 0;
    this.maxJumps = 2;
  }

  update(cursors) {
    const speed = 200;
    const jumpForce = -400;

    if (cursors.left.isDown) this.setVelocityX(-speed);
    else if (cursors.right.isDown) this.setVelocityX(speed);
    else this.setVelocityX(0);

    if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumps < this.maxJumps) {
      this.setVelocityY(jumpForce);
      this.jumps++;
    }

    if (this.body.blocked.down) this.jumps = 0;
  }
}

// ---- Level 1 ----
class Level1 extends Phaser.Scene {
  constructor() { super('Level1'); }

  create() {
    this.add.rectangle(400, 300, 800, 600, 0x000000); // black background

    // Platforms (green blocks)
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 580, 'ground').setScale(2).setTint(0x00ff00).refreshBody();
    this.platforms.create(600, 450, 'ground').setTint(0x00ff00);
    this.platforms.create(50, 350, 'ground').setTint(0x00ff00);
    this.platforms.create(750, 220, 'ground').setTint(0x00ff00);

    // Player
    this.player = new Player(this, 100, 450);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.platforms);

    // Coins
    this.coins = this.physics.add.group({
      key: 'coin',
      repeat: 7,
      setXY: { x: 100, y: 0, stepX: 100 }
    });
    this.coins.children.iterate(c => c.setBounceY(Phaser.Math.FloatBetween(0.3, 0.6)));

    this.physics.add.collider(this.coins, this.platforms);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    // Enemies
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      let enemy = this.enemies.create(200 + i * 250, 0, 'enemy');
      enemy.setBounce(1);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);

    // Portal (for Level 2)
    this.portal = this.physics.add.sprite(750, 150, 'portal');
    this.portal.body.allowGravity = false;
    this.portal.setScale(1.2);
    this.physics.add.overlap(this.player, this.portal, () => this.scene.start('Level2'), null, this);

    // Score
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#00ff00' });
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
  }

  hitEnemy(player, enemy) {
    this.scene.restart();
  }

  update() {
    this.player.update(this.cursors);
  }
}

// ---- Level 2 ----
class Level2 extends Phaser.Scene {
  constructor() { super('Level2'); }

  create() {
    this.add.rectangle(400, 300, 800, 600, 0x000000);
    this.add.text(250, 300, 'Level 2 - You made it!', { fontSize: '28px', fill: '#00ff00' });
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('Level1');
    });
  }
}

// ---- Config ----
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 500 }, debug: false }
  },
  scene: [BootScene, Level1, Level2]
};

const game = new Phaser.Game(config);
