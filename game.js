// Phaser 3 Adventure - Portal Version (Fixed & Improved)

// ---- Boot Scene ----
class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    // Backgrounds & platforms
    this.load.image('bg1','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/skies/space3.png');
    this.load.image('bg2','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/skies/deep-space.jpg');
    this.load.image('platform','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/platform.png');

    // Player & enemies
    this.load.spritesheet('player','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/dude.png',{ frameWidth:32, frameHeight:48 });
    this.load.image('enemy','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/ufo.png');
    this.load.image('flyingEnemy','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/alien.png');
    this.load.image('boss','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/boss.png');

    // Items
    this.load.image('coin','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/coin.png');
    this.load.image('powerup','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/star.png');
    this.load.image('spike','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/spike.png');
    this.load.image('portal','https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/blue_ball.png');
  }

  create(){
    this.scene.start('Level1');
  }
}

// ---- Player Class ----
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene,x,y){
    super(scene,x,y,'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);

    // Player attributes
    this.jumps = 0;
    this.maxJumps = 3;
    this.dashSpeed = 600;
    this.canDash = true;
    this.health = 3;
  }

  update(cursors){
    const speed = 200;
    const jumpForce = -450;

    // Horizontal movement
    if(cursors.left.isDown) this.setVelocityX(-speed);
    else if(cursors.right.isDown) this.setVelocityX(speed);
    else this.setVelocityX(0);

    // Jumping
    if(Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumps < this.maxJumps){
      this.setVelocityY(jumpForce);
      this.jumps++;
    }

    // Reset jumps when on floor
    if(this.body.blocked.down) this.jumps = 0;
  }

  damage(){ 
    this.health--; 
    if(this.health<=0) this.scene.scene.start('GameOverScene');
  }
}

// ---- Base Level ----
class BaseLevel extends Phaser.Scene {
  constructor(key){ super(key); }

  create(){
    // Background
    this.bg1=this.add.tileSprite(400,300,800,600,'bg1').setScrollFactor(0);
    this.bg2=this.add.tileSprite(400,300,800,600,'bg2').setScrollFactor(0);

    // Groups
    this.platforms=this.physics.add.staticGroup();
    this.platforms.create(400,580,'platform').setScale(2).refreshBody();
    this.movingPlatforms=this.physics.add.group();
    this.coins=this.physics.add.group({ allowGravity: false, immovable: true });
    this.powerups=this.physics.add.group();
    this.enemies=this.physics.add.group();
    this.flyingEnemies=this.physics.add.group();
    this.spikes=this.physics.add.group();

    // Player & controls
    this.player=new Player(this,100,500);
    this.cursors=this.input.keyboard.createCursorKeys();
    this.dashKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.dashCooldown=500;

    // Colliders
    this.physics.add.collider(this.player,this.platforms);
    this.physics.add.collider(this.player,this.movingPlatforms);
    this.physics.add.collider(this.enemies,this.platforms);
    this.physics.add.collider(this.flyingEnemies,this.platforms);
    this.physics.add.collider(this.enemies,this.movingPlatforms);
    this.physics.add.collider(this.flyingEnemies,this
