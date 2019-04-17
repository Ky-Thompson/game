import { PowerUpAnimations } from '@game/animations';
import { Body, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

import { ACTIVATE_VELOCITY_Y, VELOCITY_X } from './constants';
import { PowerUp } from './power-up';

const BEAR_DIMENSIONS: Body = { width: 23, height: 30, x: 4, y: 2 };

export class Bear extends PowerUp {
  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, VELOCITY_X, BEAR_DIMENSIONS);
  }

  protected activate() {
    // Configure power up
    this.scene.powerUps.add(this);
    this.body.velocity.y = ACTIVATE_VELOCITY_Y;

    // Play sounds
    this.scene.soundEffects.playEffect(Sounds.PowerUpAppears);

    // Play animation
    this.anims.play(PowerUpAnimations.Bear);
  }

  protected collect() {
    super.collect();
    this.upgradePlayer();
  }
}
