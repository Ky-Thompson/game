import { FireAnimations } from '@game/animations';
import { Body, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

const DIMENSIONS: Body = { width: 16, height: 16, x: 0, y: 0 };
const VELOCITY_X = 800;
const COLLIDE_VELOCITY_Y = -300;

export class Fireball extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body;

  constructor(public scene: GameScene) {
    super(scene, 0, 0, '');

    scene.physics.world.enable(this);

    this.body.setSize(DIMENSIONS.width, DIMENSIONS.height);
    this.body.offset.set(DIMENSIONS.x, DIMENSIONS.y);

    const onAnimationComplete = () => {
      if (this.anims.currentAnim.key === FireAnimations.Explode) {
        this.setActive(false);
        this.setVisible(false);
      }
    };
    this.on('animationcomplete', onAnimationComplete, this);
  }

  update() {
    if (!this.active) {
      return;
    }

    this.scene.world.collide(this, () => this.collided());
    this.scene.enemies.overlapFire(this);
  }

  private collided() {
    if (this.body.velocity.y === 0) {
      this.body.velocity.y = COLLIDE_VELOCITY_Y; // Bounce on horizontal collision
    }

    if (this.body.velocity.x === 0) {
      this.scene.soundEffects.playEffect(Sounds.Bump);
      this.explode();
    }
  }

  explode() {
    this.body.allowGravity = false;
    this.body.velocity.y = 0;
    this.play(FireAnimations.Explode);
  }

  fire(x: number, y: number, leftDirection: boolean) {
    this.setPosition(x, y);
    this.body.velocity.x = VELOCITY_X * (leftDirection ? -1 : 1);
    this.body.allowGravity = true;

    this.setActive(true);
    this.setVisible(true);

    this.play(FireAnimations.Fly);
    this.scene.soundEffects.playEffect(Sounds.Fireball);
  }
}
