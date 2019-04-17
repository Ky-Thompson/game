import { PowerUpAnimations } from '@game/animations';
import { Body, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

import { VELOCITY_X } from './constants';
import { PowerUp } from './power-up';

const BUTTERFLY_VELOCITY_Y = -600;
const BUTTERFLY_DIMENSIONS: Body = { width: 32, height: 30, x: 0, y: 1 };

export class Butterfly extends PowerUp {
  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, VELOCITY_X, BUTTERFLY_DIMENSIONS);
  }

  protected activate() {
    // Configure power up
    this.scene.powerUps.add(this);
    this.body.velocity.y = BUTTERFLY_VELOCITY_Y;

    // Play sounds
    this.scene.soundEffects.playEffect(Sounds.PowerUpAppears);

    // Play animation
    this.anims.play(PowerUpAnimations.Butterfly);
  }

  update() {
    super.update();

    // Bounce
    if (this.body && this.body.blocked.down) {
      this.body.velocity.y = BUTTERFLY_VELOCITY_Y;
    }
  }

  protected collect() {
    super.collect();

    this.scene.player.activateStar();
    this.scene.soundEffects.playEffect(Sounds.PowerUp);
  }
}
