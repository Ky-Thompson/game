import { LiarAnimations } from '@game/animations';
import { Body } from '@game/models';
import { GameScene } from '@game/scenes';

import { Enemy } from './enemy';

const DIMENSIONS: Body = { width: 28, height: 20, x: 2, y: 12 };
const KILLED_TIMEOUT: number = 500;

export class Liar extends Enemy {
  private killedTime: number = 0;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y);
    this.setFlipX(true);
    this.setBody(DIMENSIONS);
    this.animate();
  }

  private animate(animation: LiarAnimations = LiarAnimations.Default) {
    this.anims.play(animation);
  }

  update(delta: number) {
    if (!this.isActivated()) {
      return;
    }

    this.collideGround();

    // The killtimer is set, keep the flat enemy then kill it
    if (this.killedTime !== 0) {
      this.body.setVelocityX(0);
      this.killedTime -= delta;

      if (this.killedTime < 0) {
        this.remove();
      }

      return;
    }

    // Collide with Player
    this.scene.physics.world.overlap(this, this.scene.player, () => this.playerHit());

    // The enemy stopped, better try to walk in the other direction.
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.setVelocityX(this.direction);
      this.setFlipX(this.direction < 0);
    }
  }

  playerHit() {
    if (this.isVerticalHit()) {
      // Player jumps on the enemy
      this.scene.player.enemyBounce(this);
      this.flatten();
      this.kill();
      this.updatePoints();
    } else {
      // Player collides with the enemy
      this.hurtPlayer();
    }
  }

  private flatten() {
    this.animate(LiarAnimations.Flattened);
    this.killedTime = KILLED_TIMEOUT; // Keep liar flat for a time, then remove it.
  }
}
