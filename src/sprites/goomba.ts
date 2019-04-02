import { GoombaAnimations } from '../animations';
import { GameScene } from '../scenes';
import { Enemy } from './enemy';

const KILLED_TIMEOUT: number = 500;

export class Goomba extends Enemy {
  private killedTime: number = 0;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y);
    this.animate();
  }

  private animate(animation: GoombaAnimations = GoombaAnimations.Default) {
    this.anims.play(animation);
  }

  update(time: number, delta: number) {
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
      this.body.velocity.x = this.direction;
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
    this.animate(GoombaAnimations.Flattened);
    this.killedTime = KILLED_TIMEOUT; // Keep goomba flat for a time, then remove it.
  }
}
