import { Body } from '../models';
import { GameScene } from '../scenes';
import { Mario } from './mario';

/**
 * Generic enemy class that extends Phaser sprites.
 * Classes for enemy types extend this class.
 */
export abstract class Enemy extends Phaser.GameObjects.Sprite {
  static DEFAULT_BODY: Body = { width: 24, height: 24, x: 3, y: 8 };
  static INITIAL_POSITION_Y: number = 32;
  static INITIAL_POSITION_X: number = 64;
  static VERTICAL_COLLISION_THRESHOLD: number = 10;
  static KILLED_VELOCITY_Y: number = -400;
  static KILLED_SCORE: number = 100;
  static BASE_DIRECTION_VELOCITY: number = -100;

  protected readonly currentScene: GameScene;
  protected direction: number = Enemy.BASE_DIRECTION_VELOCITY;
  private activated: boolean = false;
  private alive: boolean = true;
  private hasBeenSeen: boolean = false;
  private dropped: boolean = false;
  abstract type;
  body: Phaser.Physics.Arcade.Body;

  constructor(config) {
    // TODO: Use interface for config
    super(config.scene, config.x, config.y - Enemy.INITIAL_POSITION_Y, config.key);

    this.currentScene = config.scene;
    this.currentScene.physics.world.enable(this);
    this.currentScene.add.existing(this);

    this.init();
  }

  private init() {
    // Start still and wait until needed
    this.body
      .setVelocity(0, 0)
      .setBounce(0, 0)
      .setCollideWorldBounds(false);

    this.body.allowGravity = false;

    this.setBody(Enemy.DEFAULT_BODY);
  }

  protected setBody(body: Partial<Body>) {
    body = { ...Enemy.DEFAULT_BODY, ...(body || {}) };
    this.body.setSize(body.width, body.height);
    this.body.offset.set(body.x, body.y);
  }

  protected get player(): Mario {
    return this.currentScene.mario;
  }

  protected get isActivated(): boolean {
    // Check if it is alive
    if (!this.alive) {
      if (this.y > this.currentScene.sys.game.config.height * 2) {
        this.remove();
      }
    }

    // Check if it's being seen now and if so, activate it
    if (!this.hasBeenSeen) {
      if (this.x < this.currentScene.cameras.main.scrollX + this.currentScene.sys.game.canvas.width + Enemy.INITIAL_POSITION_X) {
        this.hasBeenSeen = true;
        this.body.velocity.x = this.direction;
        this.body.allowGravity = true;
        this.activated = true;
      }
    }

    return this.body && this.activated;
  }

  protected get isVerticalHit(): boolean {
    if (!this.player.alive) {
      return false;
    }

    // Check if a collision between the enemy and Mario is from above.
    const verticalSpeed: boolean = this.player.body.velocity.y >= 0;
    const verticalCollision: boolean = this.player.body.y + this.player.body.height - this.body.y < Enemy.VERTICAL_COLLISION_THRESHOLD;

    return verticalSpeed && verticalCollision;
  }

  protected collideGround() {
    if (!this.dropped) {
      this.currentScene.physics.world.collide(this, this.currentScene.groundLayer);
    }
  }

  protected hurtPlayer() {
    if (this.alive && this.player.alive) {
      this.player.hurtBy(this);
    }
  }

  abstract update(time: number, delta: number): void;

  updatePoints() {
    this.currentScene.updateScore(Enemy.KILLED_SCORE);
    this.currentScene.sound.playAudioSprite('sfx', 'smb_stomp');
  }

  kill(drop: boolean = false) {
    if (!this.alive) {
      return;
    }

    this.alive = false;

    if (drop) {
      this.body.setVelocityY(Enemy.KILLED_VELOCITY_Y); // Make it fall
      this.flipY = true;
      this.dropped = true;
    } else {
      this.body.setVelocityX(0);
      this.body.setAccelerationX(0);
      this.body.setVelocityY(0);
      this.body.setAccelerationY(0);
    }
  }

  remove() {
    this.currentScene.enemies.remove(this);
    this.destroy();
  }
}
