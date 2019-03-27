import { GoombaAnimations } from '../animations';
import { Enemy } from './enemy';

export class Goomba extends Enemy {
  static KILLED_TIMEOUT: number = 500;

  private killedTime: number = 0;
  readonly type = GoombaAnimations.Default;

  constructor(config) {
    super(config);
    this.animate();
  }

  private animate(animation: GoombaAnimations = GoombaAnimations.Default) {
    this.anims.play(animation);
  }

  update(time: number, delta: number) {
    if (!this.isActivated) {
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
    this.currentScene.physics.world.overlap(this, this.currentScene.mario, () => this.playerHit());

    // The enemy stopped, better try to walk in the other direction.
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.velocity.x = this.direction;
    }
  }

  playerHit() {
    if (this.isVerticalHit) {
      // Player jumps on the enemy
      this.player.enemyBounce(this);
      this.flatten();
      this.kill();
      this.updatePoints();
    } else {
      // Player collides with the enemy
      this.hurtPlayer();
    }
  }

  private flatten() {
    this.animate(GoombaAnimations.Flattened);
    this.killedTime = Goomba.KILLED_TIMEOUT; // Keep goomba flat for a time, then remove it.
  }
}
