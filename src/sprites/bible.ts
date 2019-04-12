import { BibleAnimations } from '@game/animations';
import { GRAVITY } from '@game/config';
import { Body, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

const DIMENSIONS: Body = { width: 22, height: 28, x: 0, y: 0 };
const VELOCITY_X = 600;
const ANGULAR_VELOCITY = 700;
const BIBLE_GRAVITY = GRAVITY / 2;
const COLLIDE_VELOCITY_Y = -200;

export class Bible extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body;

  constructor(public scene: GameScene) {
    super(scene, 0, 0, '');

    scene.physics.world.enable(this);

    this.body.setSize(DIMENSIONS.width, DIMENSIONS.height);
    this.body.offset.set(DIMENSIONS.x, DIMENSIONS.y);
  }

  update() {
    if (!this.active) {
      return;
    }

    this.scene.world.collide(this, () => this.collided());
    this.scene.enemies.overlapBible(this);
  }

  private collided() {
    if (this.body.velocity.y === 0) {
      this.body.velocity.y = COLLIDE_VELOCITY_Y; // Bounce on horizontal collision
    }

    if (this.body.velocity.x === 0) {
      this.terminate();
    }
  }

  terminate() {
    this.scene.soundEffects.playEffect(Sounds.Bump);
    this.setActive(false);
    this.setVisible(false);
  }

  throw(x: number, y: number, leftDirection: boolean) {
    this.setPosition(x, y);
    this.body.velocity.y = 0;
    this.body.velocity.x = VELOCITY_X * (leftDirection ? -1 : 1);
    this.body.angularVelocity = ANGULAR_VELOCITY;
    this.body.allowGravity = true;
    this.body.gravity.y = -GRAVITY + BIBLE_GRAVITY;

    this.setActive(true);
    this.setVisible(true);

    this.play(BibleAnimations.Fly);
    this.scene.soundEffects.playEffect(Sounds.ThrowBible);
  }
}
