// Phaser 3 Adventure - Rectangle Version

// ---- Boot Scene ----
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    this.add.text(200, 250, 'Click to Start Game', { fontSize: '32px', fill: '#fff' });
    this.input.once('pointerdown', () => this.scene.start('Level1'));
  }
}

// ---- Player Class ----
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(32, 48);
    this.setBounce(0.1);
    this.setCollideWorldBounds(true);
    this.health = 3;
    this.maxJumps = 2;
    this.jumpCount = 0;
    this.canDash = true;
    this.dashSpeed = 600;
  }

  damage() {
    this.health--;
    if (this.health <= 0) this.scene.start('GameOverScene');
  }

  update(cursors) {
    if (cursors.left.isDown) this.setVelocityX(-200);
    else if (cursors.right.isDown) this.setVelocityX(200);
    else this.setVelocityX(0);

    if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumpCount < this.maxJumps) {
      this.setVelocityY(-400);
      this.jumpCount++;
    }

    if (this.body.onFloor()) this.jumpCount = 0;
  }
}

// ---- Base Level ----
class BaseLevel extends Phaser.Scene {
  constructor(key) { super(key); }

  create() {
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group();
    this.coins = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.player = new Player(this, 100, 500);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.dashCooldown = 500;

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.movingPlatforms);

    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#fff' });
    this.healthText = this.add.text(16, 50, 'Health: ' + this.player.health, { fontSize: '24px', fill: '#fff' });

    // Coin overlap
    this.physics.add.overlap(this.player, this.coins, (player, coin) => {
      coin.destroy();
      this.score += 10;
      this.scoreText.setText('Score: ' + this.score);
      if (this.coins.countActive(true) === 0) {
        this.time.delayedCall(500, () => this.scene.start('Level2'));
      }
    });

    // Enemy collision
    this.physics.add.collider(this.player, this.enemies, () => this.player.damage());
  }

  spawnPlatform(x, y, width = 100, height = 20, color = 0x00ff00) {
    const plat = this.add.rectangle(x, y, width, height, color);
    this.physics.add.existing(plat, true);
    this.platforms.add(plat);
    return plat;
  }

  spawnMovingPlatform(x, y, vx = 50, width = 100, height = 20, color = 0x00aa00) {
    const plat = this.add.rectangle(x, y, width, height, color);
    this.physics.add.existing(plat);
    plat.body.setImmovable(true);
    plat.body.allowGravity = false;
    plat.body.setVelocityX(vx);
    this.movingPlatforms.add(plat);
    return plat;
  }

  spawnCoin(x, y, size = 20, color = 0xffff00) {
    const coin = this.add.rectangle(x, y, size, size, color);
    this.physics.add.existing(coin);
    coin.body.setAllowGravity(false);
    coin.body.setImmovable(true);
    this.coins.add(coin);
    return coin;
  }

  spawnEnemy(x, y, width = 32, height = 32, color = 0xff0000) {
    const enemy = this.add.rectangle(x, y, width, height, color);
    this.physics.add.existing(enemy);
    enemy.body.setCollideWorldBounds(true);
    enemy.body.setBounce(1);
    enemy.body.setVelocityX(50);
    this.enemies.add(enemy);
    return enemy;
  }

  update() {
    this.player.update(this.cursors);
    this.healthText.setText('Health: ' + this.player.health);
  }
}

// ---- Level 1 ----
class Level1 extends BaseLevel {
  constructor() { super('Level1'); }

  create() {
    super.create();
    this.spawnPlatform(400, 580, 800, 40); // floor
    this.spawnPlatform(200, 450, 100, 20);
    this.spawnPlatform(600, 350, 150, 20);
    this.spawnMovingPlatform(400, 250, 50);

    this.spawnCoin(150, 300);
    this.spawnCoin(300, 200);
    this.spawnCoin(500, 150);

    this.spawnEnemy(400, 520);
    this.spawnEnemy(600, 400);
  }

  update() {
    super.update();
    this.movingPlatforms.children.iterate(p => {
      if (p.x >= 700 || p.x <= 100) p.body.velocity.x *= -1;
    });
  }
}

// ---- Level 2 ----
class Level2 extends BaseLevel {
  constructor() { super('Level2'); }

  create() {
    super.create();
    this.spawnPlatform(400, 580, 800, 40); // floor
    this.spawnPlatform(500, 400, 100, 20);
    this.spawnPlatform(300, 300, 100, 20);
    this.spawnMovingPlatform(600, 350, -50);

    this.spawnCoin(200, 200);
    this.spawnCoin(400, 150);
    this.spawnCoin(600, 100);

    this.spawnEnemy(350, 520);
    this.spawnEnemy(550, 250);
  }

  update() {
    super.update();
    this.movingPlatforms.children.iterate(p => {
      if (p.x >= 700 || p.x <= 100) p.body.velocity.x *= -1;
    });
  }
}

// ---- Game Over ----
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  create() {
    this.add.text(250, 250, 'Game Over', { fontSize: '48px', fill: '#f00' });
    this.add.text(200, 320, 'Press SPACE to restart', { fontSize: '24px', fill: '#fff' });
    this.input.keyboard.on('keydown-SPACE', () => { this.scene.start('Level1'); });
  }
}

// ---- Game Config ----
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: 'arcade', arcade: { gravity: { y: 1000 }, debug: false } },
  scene: [BootScene, Level1, Level2, GameOverScene]
};

const game = new Phaser.Game(config);
