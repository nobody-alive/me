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
        this.jumpCount = 0;
        this.maxJumps = 2;
    }

    damage() {
        this.health--;
        if (this.health <= 0) this.scene.start('GameOverScene');
    }

    update(cursors) {
        const speed = 200;
        if (cursors.left.isDown) this.setVelocityX(-speed);
        else if (cursors.right.isDown) this.setVelocityX(speed);
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
        // Groups
        this.platforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group();
        this.coins = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();

        // Player
        this.player = new Player(this, 100, 500);
        this.cursors = this.input.keyboard.createCursorKeys();

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.movingPlatforms);

        // Overlaps
        this.physics.add.overlap(this.player, this.coins, (p, coin) => {
            coin.destroy();
        });

        this.physics.add.collider(this.player, this.enemies, (p, e) => {
            p.damage();
        });

        // Score / Health text
        this.healthText = this.add.text(16, 16, 'Health: ' + this.player.health, { fontSize: '24px', fill: '#fff' }).setScrollFactor(0);
    }

    spawnPlatform(x, y, w = 100, h = 20, color = 0x00ff00) {
        const rect = this.add.rectangle(x, y, w, h, color);
        this.physics.add.existing(rect, true);
        this.platforms.add(rect);
        return rect;
    }

    spawnMovingPlatform(x, y, vx = 50, w = 100, h = 20, color = 0x00aa00) {
        const rect = this.add.rectangle(x, y, w, h, color);
        this.physics.add.existing(rect);
        rect.body.setVelocityX(vx);
        rect.body.setBounce(1, 0);
        rect.body.setImmovable(true);
        rect.body.allowGravity = false;
        this.movingPlatforms.add(rect);
        return rect;
    }

    spawnCoin(x, y, size = 20, color = 0xffff00) {
        const rect = this.add.rectangle(x, y, size, size, color);
        this.physics.add.existing(rect, true);
        this.coins.add(rect);
        return rect;
    }

    spawnEnemy(x, y, w = 32, h = 32, color = 0xff0000, speed = 50) {
        const rect = this.add.rectangle(x, y, w, h, color);
        this.physics.add.existing(rect);
        rect.body.setVelocityX(speed);
        rect.body.setBounce(1);
        rect.body.setCollideWorldBounds(true);
        rect.body.allowGravity = false;
        this.enemies.add(rect);
        return rect;
    }

    update() {
        this.player.update(this.cursors);
        this.healthText.setText('Health: ' + this.player.health);

        // Move moving platforms back and forth
        this.movingPlatforms.children.iterate(p => {
            if (p.x >= 700 || p.x <= 100) p.body.velocity.x *= -1;
        });

        // Move enemies back and forth
        this.enemies.children.iterate(e => {
            if (e.x >= 750 || e.x <= 50) e.body.velocity.x *= -1;
        });
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
}

// ---- Game Over ----
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    create() {
        this.add.text(250, 250, 'Game Over', { fontSize: '48px', fill: '#f00' });
        this.add.text(200, 320, 'Press SPACE to restart', { fontSize: '24px', fill: '#fff' });
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('Level1'));
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
