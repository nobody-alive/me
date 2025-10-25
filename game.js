// Phaser 3 Adventure - v2

// ---- Boot Scene ----
class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    this.load.image('bg1','https://i.imgur.com/3eQ1Z7g.png');
    this.load.image('bg2','https://i.imgur.com/Fj8Dpr2.png');
    this.load.image('platform','https://i.imgur.com/x2tXQ0A.png'); 
    this.load.spritesheet('player','https://i.imgur.com/8QHMP5v.png',{ frameWidth:32, frameHeight:48 });
    this.load.image('enemy','https://i.imgur.com/Z6XjD3H.png');
    this.load.image('flyingEnemy','https://i.imgur.com/T0FIScV.png'); 
    this.load.image('coin','https://i.imgur.com/wO6xM8M.png');
    this.load.image('powerup','https://i.imgur.com/Y6gKzQp.png');
    this.load.image('spike','https://i.imgur.com/2lG1k0c.png');
    this.load.image('boss','https://i.imgur.com/CEfM2vC.png');
  }

  create(){ this.scene.start('Level1'); }
}

// ---- Player Class ----
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene,x,y){
    super(scene,x,y,'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
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
    if(this.health<=0) this.scene.start('GameOverScene'); 
  }
}

// ---- Base Level ----
class BaseLevel extends Phaser.Scene {
  constructor(key){ super(key); }

  create(){
    this.bg1=this.add.tileSprite(400,300,800,600,'bg1').setScrollFactor(0);
    this.bg2=this.add.tileSprite(400,300,800,600,'bg2').setScrollFactor(0);

    this.platforms=this.physics.add.staticGroup();
    this.platforms.create(400,580,'platform').setScale(2).refreshBody();
    this.movingPlatforms=this.physics.add.group();
    this.coins=this.physics.add.group({ allowGravity: false, immovable: true });
    this.powerups=this.physics.add.group();
    this.enemies=this.physics.add.group();
    this.flyingEnemies=this.physics.add.group();
    this.spikes=this.physics.add.group();

    this.player=new Player(this,100,500);
    this.cursors=this.input.keyboard.createCursorKeys();
    this.dashKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.dashCooldown=500;

    this.physics.add.collider(this.player,this.platforms);
    this.physics.add.collider(this.player,this.movingPlatforms);
    this.physics.add.collider(this.enemies,this.platforms);
    this.physics.add.collider(this.flyingEnemies,this.platforms);
    this.physics.add.collider(this.enemies,this.movingPlatforms);
    this.physics.add.collider(this.flyingEnemies,this.movingPlatforms);

    this.physics.add.overlap(this.player,this.coins,(p,c)=>{
      c.destroy();
      this.score+=10;
      this.scoreText.setText('Score: '+this.score);
    });

    this.physics.add.overlap(this.player,this.powerups,(p,pu)=>{
      pu.destroy();
      if(pu.type==='tripleJump') this.player.maxJumps=5;
      if(pu.type==='dash') this.player.dashSpeed=1000;
    });

    this.physics.add.collider(this.player,this.enemies,()=>{ this.player.damage(); });
    this.physics.add.collider(this.player,this.flyingEnemies,()=>{ this.player.damage(); });
    this.physics.add.collider(this.player,this.spikes,()=>{ this.player.damage(); });

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0,0,1600,600);

    this.score=0;
    this.scoreText=this.add.text(16,16,'Score: 0',{fontSize:'24px',fill:'#fff'}).setScrollFactor(0);
    this.healthText=this.add.text(16,50,'Health: '+this.player.health,{fontSize:'24px',fill:'#fff'}).setScrollFactor(0);
  }

  spawnMovingPlatform(x,y,vx){ 
    const plat=this.physics.add.sprite(x,y,'platform').setImmovable(true).setVelocityX(vx); 
    plat.body.allowGravity=false; 
    this.movingPlatforms.add(plat); 
  }

  spawnEnemy(x,y){ 
    const enemy=this.enemies.create(x,y,'enemy'); 
    enemy.setVelocityX(50);
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(1); 
  }

  spawnFlyingEnemy(x,y){ 
    const fe=this.flyingEnemies.create(x,y,'flyingEnemy'); 
    fe.setVelocityX(80);
    fe.setCollideWorldBounds(true);
    fe.setBounce(1); 
  }

  spawnCoin(x,y){ this.coins.create(x,y,'coin'); }
  spawnPowerup(x,y,type){ const pu=this.powerups.create(x,y,'powerup'); pu.type=type; }
  spawnSpike(x,y){ this.spikes.create(x,y,'spike'); }

  update(){
    this.bg1.tilePositionX=this.cameras.main.scrollX*0.3;
    this.bg2.tilePositionX=this.cameras.main.scrollX*0.6;

    this.movingPlatforms.children.iterate(p=>{ if(p.x>=700||p.x<=100) p.body.velocity.x*=-1; });

    this.player.update(this.cursors);

    if(Phaser.Input.Keyboard.JustDown(this.dashKey)&&this.player.canDash){ 
      const dir=this.cursors.left.isDown?-1:(this.cursors.right.isDown?1:1); 
      this.player.setVelocityX(dir*this.player.dashSpeed); 
      this.player.canDash=false; 
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

    this.spawnMovingPlatform(400,250,50);

    this.spawnCoin(150,300);
    this.spawnCoin(300,200);
    this.spawnCoin(500,150);
    this.spawnPowerup(700,500,'tripleJump');

    this.spawnEnemy(400,520);
    this.spawnFlyingEnemy(600,200);
    this.spawnSpike(350,560);
    this.spawnSpike(450,560);

    this.coins.children.iterate(c => {
      this.tweens.add({
        targets: c,
        y: c.y - 10,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  update(){
    super.update();
    if(this.player.x>1500) this.scene.start('Level2'); 
  }
}

// ---- Level 2 ----
class Level2 extends BaseLevel {
  constructor(){ super('Level2'); }

  create(){ 
    super.create();

    this.platforms.create(500,400,'platform');
    this.platforms.create(300,300,'platform');
    this.platforms.create(700,250,'platform');
    this.spawnMovingPlatform(600,350,-50);

    this.spawnCoin(200,200);
    this.spawnCoin(400,150);
    this.spawnCoin(600,100);
    this.spawnPowerup(750,200,'dash');

    this.spawnEnemy(350,520);
    this.spawnFlyingEnemy(550,250);
    this.spawnFlyingEnemy(700,150);

    this.coins.children.iterate(c => {
      this.tweens.add({
        targets: c,
        y: c.y - 10,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    this.boss = this.physics.add.sprite(1400,400,'boss');
    this.boss.setImmovable(true); 
    this.physics.add.collider(this.boss,this.platforms); 
    this.physics.add.collider(this.player,this.boss,()=>{ this.player.damage(); });

    this.time.addEvent({
      delay:2000,
      callback:()=>{ 
        const vx = (this.boss.body.velocity.x === 0) ? -100 : -this.boss.body.velocity.x;
        this.boss.setVelocityX(vx);
      },
      loop:true
    });
  }

  update(){ 
    super.update(); 
    if(this.player.x>1500){
      this.scene.start('GameOverScene');
    }
  }
}

// ---- Game Over ----
class GameOverScene extends Phaser.Scene {
  constructor(){ super('GameOverScene'); }
  create(){
    this.add.text(250,250,'Game Over',{fontSize:'48px',fill:'#f00'});
    this.add.text(200,320,'Press SPACE to restart',{fontSize:'24px',fill:'#fff'});
    this.input.keyboard.on('keydown-SPACE',()=>{ this.scene.start('Level1'); });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1000 }, debug: false }
  },
  scene: [BootScene, Level1, Level2, GameOverScene]
};

new Phaser.Game(config);
