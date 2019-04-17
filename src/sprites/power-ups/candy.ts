import { getCandyAnimationKey } from '@game/animations';
import { Body, Scores, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

import { PowerUp } from './power-up';

export const CANDY_DIMENSIONS: Body = { width: 28, height: 32, x: 0, y: 0 };

export class Candy extends PowerUp {
  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, 0, CANDY_DIMENSIONS);
  }

  protected activate() {
    // Configure power up
    this.body.setVelocity(0, 0);
    this.body.allowGravity = false;

    // Play animation
    this.anims.play(getCandyAnimationKey());
  }

  collect() {
    this.scene.hud.updateScore(Scores.Candy);
    this.scene.soundEffects.playEffect(Sounds.Candy);
    this.alpha = 0;
  }
}
