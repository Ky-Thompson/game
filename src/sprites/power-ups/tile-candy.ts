import { getCandyAnimationKey } from '@game/animations';
import { Scores, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

import { CANDY_DIMENSIONS } from './candy';
import { PowerUp } from './power-up';

const ANIMATION_DURATION = 500;
const CANDY_MOVEMENT_Y = 100;
const CANDY_EASING = 'Quad.easeOut';

export class TileCandy extends PowerUp {
  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, 0, CANDY_DIMENSIONS);
  }

  protected activate() {
    // Configure power up
    this.setActive(false);
    this.body.setVelocity(0, 0);
    this.body.allowGravity = false;
    this.scene.tweens.add({
      targets: this,
      y: this.y - CANDY_MOVEMENT_Y,
      ease: CANDY_EASING,
      duration: ANIMATION_DURATION,
      onComplete: () => this.collect(),
    });

    // Play sounds and collect points
    this.scene.soundEffects.playEffect(Sounds.Candy);
    this.scene.hud.updateScore(Scores.Candy);

    // Play animation
    this.anims.play(getCandyAnimationKey());
  }

  collect() {
    this.setAlpha(0);
  }
}
