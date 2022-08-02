import Phaser from 'phaser';
import FallingObject from '../ui/FallingObject';
import Laser from '../ui/Laser';

export default class CoronaBusterScene extends Phaser.Scene {
  constructor() {
    super('corona-buster-scene');
  }
  init() {
    // Clouds
    this.clouds = undefined;

    // Creating buttons
    this.nav_left = false;
    this.nav_right = false;
    this.shoot = false;

    // PLayer & speed
    this.player = undefined;
    this.speed = 100;
    this.cursor = undefined;

    // Enemies
    this.enemies = undefined;
    this.enemySpeed = 50;

    // Lasers
    this.lasers = undefined;
    this.lastFired = 10;
  }

  preload() {
    this.load.image('background', 'images/bg_layer1.png');
    this.load.image('cloud', 'images/cloud.png');
    this.load.image('left-btn', 'images/left-btn.png');
    this.load.image('right-btn', 'images/right-btn.png');
    this.load.image('shoot-btn', 'images/shoot-btn.png');
    this.load.spritesheet('player', 'images/ship.png', {
      frameWidth: 66,
      frameHeight: 66,
    });
    this.load.image('enemy', 'images/enemy.png');
    this.load.spritesheet('laser', 'images/laser-bolts.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    // Bg
    const gameWidth = this.scale.width * 0.5;
    const gameHeight = this.scale.height * 0.5;
    this.add.image(gameWidth, gameHeight, 'background');

    // Clouds
    this.clouds = this.physics.add.group({
      key: 'cloud',
      repeat: 10,
    });

    // Atur posisi acak dalam bentuk rectangle
    Phaser.Actions.RandomRectangle(
      this.clouds.getChildren(),
      this.physics.world.bounds
    );

    // Create buttons
    this.createButtons();

    // Untuk keyboard control
    this.cursor = this.input.keyboard.createCursorKeys();

    // Panggil createPlayer() method untuk buat player
    this.player = this.createPlayer();

    // Buat musuhnya muncul setiap 1-5 detik
    this.enemies = this.physics.add.group({
      classType: FallingObject,
      maxSize: 10,
      runChildUpdate: true,
    });

    this.time.addEvent({
      delay: Phaser.Math.Between(1000, 5000),
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    // Buat tembakan laser
    this.lasers = this.physics.add.group({
      classType: Laser,
      maxSize: 10,
      runChildUpdate: true,
    });

    // Code waktu laser dan virus overlap
    this.physics.add.overlap(
      this.lasers,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );
  }

  update(time) {
    // buat awan bergerak ke bawah
    this.clouds.children.iterate((child) => {
      // @ts-ignore
      child.setVelocityY(20); // ignore error here

      // Buat awannya ada terus diulang ulang
      // @ts-ignore

      if (child.y > this.scale.height) {
        // @ts-ignore
        child.x = Phaser.Math.Between(10, 400); // random nums from 10 400 inclusive

        // @ts-ignore
        child.y = 0;
      }
    });

    // Gerakan player
    this.movePlayer(this.player, time);
  }

  createButtons() {
    this.input.addPointer(3);

    let shoot = this.add
      .image(320, 550, 'shoot-btn')
      .setInteractive()
      .setDepth(0.5)
      .setAlpha(0.8);

    let nav_left = this.add
      .image(50, 550, 'left-btn')
      .setInteractive()
      .setDepth(0.5)
      .setAlpha(0.8);

    let nav_right = this.add
      .image(nav_left.x + nav_left.displayWidth + 20, 550, 'right-btn')
      .setInteractive()
      .setDepth(0.5)
      .setAlpha(0.8);

    nav_left.on(
      'pointerdown',
      () => {
        this.nav_left = true;
      },
      this
    );

    nav_left.on(
      'pointerout',
      () => {
        this.nav_left = false;
      },
      this
    );

    nav_right.on(
      'pointerdown',
      () => {
        this.nav_right = true;
      },
      this
    );

    nav_right.on(
      'pointerout',
      () => {
        this.nav_right = false;
      },
      this
    );

    shoot.on(
      'pointerdown',
      () => {
        this.shoot = true;
      },
      this
    );

    shoot.on(
      'pointerout',
      () => {
        this.shoot = false;
      },
      this
    );
  }

  createPlayer() {
    const player = this.physics.add.sprite(200, 450, 'player');
    player.setCollideWorldBounds(true);

    // Player animations
    this.anims.create({
      key: 'turn',
      frames: [
        {
          key: 'player',
          frame: 0,
        },
      ],
    });

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', {
        start: 1,
        end: 2,
      }),
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', {
        start: 1,
        end: 2,
      }),
    });
    return player;
  }

  movePlayer(player, time) {
    if (this.cursor.left.isDown || this.nav_left) {
      this.player.setVelocityX(this.speed * -1);
      this.player.anims.play('left', true);
      this.player.setFlipX(false);
    } else if (this.cursor.right.isDown || this.nav_right) {
      this.player.setVelocityX(this.speed);
      this.player.anims.play('right', true);
      this.player.setFlipX(true);
    } else if (this.cursor.up.isDown) {
      this.player.setVelocity(0, this.speed * -1);
      this.player.anims.play('turn', true);
    } else if (this.cursor.down.isDown) {
      this.player.setVelocity(0, this.speed);
      this.player.anims.play('turn', true);
    } else {
      this.player.setVelocity(0);
      this.player.anims.play('turn');
    }

    if (this.shoot && time > this.lastFired) {
      const laser = this.lasers.get(0, 0, 'laser');
      if (laser) {
        laser.fire(this.player.x, this.player.y);
        this.lastFired = time + 150;
      }
    }
  }

  spawnEnemy() {
    const config = {
      speed: 30,
      rotation: 0.1,
    };
    // @ts-ignore
    const enemy = this.enemies.get(0, 0, 'enemy', config);
    const positionX = Phaser.Math.Between(50, 350);
    if (enemy) {
      enemy.spawn(positionX);
    }
  }

  hitEnemy(laser, enemy) {
    laser.die();
    enemy.die();
  }
}
