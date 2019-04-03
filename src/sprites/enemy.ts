import { SPRITES_KEY } from '@game/animations';
import { Body, Scores, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

const DEFAULT_BODY: Body = { width: 24, height: 24, x: 3, y: 8 };
const INITIAL_POSITION_Y: number = 32;
const INITIAL_POSITION_X: number = 64;
const VERTICAL_COLLISION_THRESHOLD: number = 10;
const KILLED_VELOCITY_Y: number = -400;
const BASE_DIRECTION_VELOCITY: number = -100;

export enum EnemyTypes {
  Goomba = 'goomba',
  Turtle = 'turtle',
}

/**
 * Generic enemy class that extends Phaser sprites.
 * Classes for enemy types extend this class.
 */
export abstract class Enemy extends Phaser.GameObjects.Sprite {
  protected direction: number = BASE_DIRECTION_VELOCITY;
  private activated: boolean = false;
  private alive: boolean = true;
  private hasBeenSeen: boolean = false;
  private dropped: boolean = false;

  body: Phaser.Physics.Arcade.Body;

  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y - INITIAL_POSITION_Y, SPRITES_KEY);

    scene.physics.world.enable(this);
    scene.add.existing(this);

    // Start still and wait until needed
    this.body
      .setVelocity(0, 0)
      .setBounce(0, 0)
      .setCollideWorldBounds(false);

    this.body.allowGravity = false;

    this.setBody(DEFAULT_BODY);
  }

  protected setBody(body: Partial<Body>) {
    body = { ...DEFAULT_BODY, ...(body || {}) };
    this.body.setSize(body.width, body.height);
    this.body.offset.set(body.x, body.y);
  }

  protected isActivated(): boolean {
    const { height } = this.scene.gameConfig();

    // Check if it is alive
    if (!this.alive) {
      if (this.y > height * 2) {
        this.remove();
      }
    }

    // Check if it's being seen now and if so, activate it
    if (!this.hasBeenSeen) {
      if (this.x < this.scene.cameras.main.scrollX + this.scene.sys.game.canvas.width + INITIAL_POSITION_X) {
        this.hasBeenSeen = true;
        this.body.velocity.x = this.direction;
        this.body.allowGravity = true;
        this.activated = true;
      }
    }

    return this.body && this.activated;
  }

  protected isVerticalHit(): boolean {
    if (!this.scene.player.isAlive()) {
      return false;
    }

    // Check if a collision between the enemy and player is from above.
    const verticalSpeed: boolean = this.scene.player.body.velocity.y >= 0;
    const verticalCollision: boolean =
      this.scene.player.body.y + this.scene.player.body.height - this.body.y < VERTICAL_COLLISION_THRESHOLD;

    return verticalSpeed && verticalCollision;
  }

  protected collideGround() {
    if (!this.dropped) {
      this.scene.world.collide(this);
    }
  }

  protected hurtPlayer() {
    if (this.alive && this.scene.player.isAlive()) {
      this.scene.player.hurtBy(this);
    }
  }

  abstract update(delta: number): void;

  updatePoints() {
    this.scene.hud.updateScore(Scores.Enemy);
    this.scene.soundEffects.playEffect(Sounds.Stomp);
  }

  kill(drop: boolean = false) {
    if (!this.alive) {
      return;
    }

    this.alive = false;

    if (drop) {
      this.body.setVelocityY(KILLED_VELOCITY_Y); // Make it fall
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
    this.scene.enemies.remove(this);
    this.destroy();
  }
}
