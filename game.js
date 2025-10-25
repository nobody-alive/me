// Phaser 3 Adventure - Rectangles Version

// ---- Boot Scene ----
class BootScene extends Phaser.Scene {
    constructor(){ super('Boot'); }
    create(){
        this.add.text(200,250,'Click to Start Game',{fontSize:'32px',fill:'#fff'});
        this.input.once('pointerdown', () => this.scene.start('Level1'));
    }
}

// ---- Player Class ----
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y){
        super(scene,x,y,null);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(32,48); // rectangle size
        this.setTint(0x00ff00); // green player
        this.setCollideWorldBounds(true);
        this.jumps = 0;
        this.maxJumps = 3;
        this.dashSpeed = 600;
        this.canDash = true;
        this.health = 3;
    }

    update(cursors){
        const speed = 200;
        const jumpForce = -450;

        if(cursors.left.isDown) this.setVelocityX(-speed);
        else if(cursors.right.isDown) this.setVelocityX(speed);
        else this.setVelocityX(0);

        if(Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumps < this.maxJumps){
            this.setVelocityY(jumpForce);
            this.jumps++;
        }

        if(this.body.onFloor()) this.jumps = 0;
    }

    damage(){ 
        this.health--; 
        if(this.health <= 0) this.scene.scene.start('GameOverScene'); 
    }
}

// ---- Base Level ----
class BaseLevel extends Phaser.Scene {
    constructor(key){ super(key); }

    create(){
        // Background color
        this.cameras.main.setBackgroundColor('#222');

        // Groups
        this.platforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group();
        this.coins = this.physics.add.group({ allowGravity:false, immovable:true });
        this.powerups = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.flyingEnemies = this.physics.add.group();
        this.spikes = this.physics.add.group();

        // Player
        this.player = new Player(this,100,500);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.dashCooldown = 500;

        // Colliders
        this.physics.add.collider(this.player,this.platforms);
        this.physics.add.collider(this.player,this.movingPlatforms);
        this.physics.add.collider(this.enemies,this.platforms);
        this.physics.add.collider(this.flyingEnemies,this.platforms);
        this.physics.add.collider(this.enemies,this.movingPlatforms);
        this.physics.add.collider(this.flyingEnemies,this.movingPlatforms);

        this.physics.add.overlap(this.player,this.coins,this.collectCoin,null,this);
        this.physics.add.collider(this.player,this.enemies,()=>this.player.damage());
        this.physics.add.collider(this.player,this.flyingEnemies,()=>this.player.damage());
        this.physics.add.collider(this.player,this.spikes,()=>this.player.damage());

        // Camera
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0,0,1600,600);

        // HUD
        this.score = 0;
        this.scoreText = this.add.text(16,16,'Score: 0',{fontSize:'24px',fill:'#fff'}).setScrollFactor(0);
        this.healthText = this.add.text(16,50,'Health: '+this.player.health,{fontSize:'24px',fill:'#fff'}).setScrollFactor(0);
    }

    collectCoin(player,coin){
        coin.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if(this.coins.countActive(true) === 0){
            this.add.text(this.player.x - 50, this.player.y - 50, 'All coins collected!', 
            { fontSize: '24px', fill: '#fff' }).setScrollFactor(0).setDepth(10);

            this.time.delayedCall(1000, () => this.scene.start('Level2'));
        }
    }

    spawnPlatform(x,y,width,height,color=0x888888){ 
        const plat = this.add.rectangle(x,y,width,height,color);
        this.physics.add.existing(plat,true);
        this.platforms.add(plat);
        return plat;
    }

    spawnMovingPlatform(x,y,width,height,vx,color=0x888888){
        const plat = this.add.rectangle(x,y,width,height,color);
        this.physics.add.existing(plat);
        plat.body.setImmovable(true).setVelocityX(vx).allowGravity = false;
        this.movingPlatforms.add(plat);
    }

    spawnCoin(x,y){
        const coin = this.add.rectangle(x,y,20,20,0xffff00);
        this.physics.add.existing(coin);
        coin.body.setAllowGravity(false);
        coin.body.setImmovable(true);
        this.coins.add(coin);
    }

    spawnEnemy(x,y){
        const e = this.add.rectangle(x,y,32,32,0xff0000);
        this.physics.add.existing(e);
        e.body.setCollideWorldBounds(true).setBounce(1).setVelocityX(50);
        this.enemies.add(e);
    }

    spawnFlyingEnemy(x,y){
        const fe = this.add.rectangle(x,y,32,32,0x0000ff);
        this.physics.add.existing(fe);
        fe.body.setCollideWorldBounds(true).setBounce(1).setVelocityX(80);
        this.flyingEnemies.add(fe);
    }

    spawnSpike(x,y,width=32,height=32){
        const s = this.add.rectangle(x,y,width,height,0xff00ff);
        this.physics.add.existing(s,true);
        this.spikes.add(s);
    }

    update(){
        this.movingPlatforms.children.iterate(p=>{
            if(p.x>=700||p.x<=100) p.body.velocity.x*=-1;
        });

        this.player.update(this.cursors);

        if(Phaser.Input.Keyboard.JustDown(this.dashKey) && this.player.canDash){
            const dir = this.cursors.left.isDown ? -1 : (this.cursors.right.isDown ? 1 : 1);
            this.player.setVelocityX(dir*this.player.dashSpeed);
            this.player.canDash = false;
            this.time.delayedCall(this.dashCooldown,()=>this.player.canDash=true);
        }

        this.healthText.setText('Health: '+this.player.health);
    }
}

// ---- Level 1 ----
class Level1 extends BaseLevel {
    constructor(){ super('Level1'); }
    create(){
        super.create();

        // Platforms
        this.spawnPlatform(400,580,800,32);
        this.spawnMovingPlatform(400,250,100,20,50);

        // Coins
        this.spawnCoin(150,300);
        this.spawnCoin(300,200);
        this.spawnCoin(500,150);

        // Enemies & spikes
        this.spawnEnemy(400,520);
        this.spawnFlyingEnemy(600,200);
        this.spawnSpike(350,560);
        this.spawnSpike(450,560);
    }
}

// ---- Level 2 ----
class Level2 extends BaseLevel {
    constructor(){ super('Level2'); }
    create(){
        super.create();
        this.spawnPlatform(500,400,100,20);
        this.spawnPlatform(300,300,100,20);
        this.spawnPlatform(700,250,100,20);
        this.spawnMovingPlatform(600,350,100,20,-50);

        this.spawnCoin(200,200);
        this.spawnCoin(400,150);
        this.spawnCoin(600,100);

        this.spawnEnemy(350,520);
        this.spawnFlyingEnemy(550,250);
        this.spawnFlyingEnemy(700,150);

        // Boss
        const boss = this.add.rectangle(1400,400,64,64,0xffffff);
        this.physics.add.existing(boss);
        boss.body.setImmovable(true);
        this.physics.add.collider(boss,this.platforms);
        this.physics.add.collider(this.player,boss,()=>this.player.damage());
    }

    update(){ 
        super.update();
        if(this.player.x > 1500) this.scene.start('GameOverScene');
    }
}

// ---- Game Over ----
class GameOverScene extends Phaser.Scene {
    constructor(){ super('GameOverScene'); }
    create(){
        this.add.text(250,250,'Game Over',{fontSize:'48px',fill:'#f00'});
        this.add.text(200,320,'Press SPACE to restart',{fontSize:'24px',fill:'#fff'});
        this.input.keyboard.on('keydown-SPACE',()=> this.scene.start('Level1'));
    }
}

// ---- Game Config ----
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: { default:'arcade', arcade:{ gravity:{y:1000}, debug:false }},
    scene: [BootScene, Level1, Level2, GameOverScene]
};

new Phaser.Game(config);
