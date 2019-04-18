import { PowerUpAnimations } from '@game/animations';
import { Body, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

import { PowerUp } from './power-up';

const ROBOT_DIMENSIONS: Body = { width: 32, height: 32, x: 0, y: 0 };
const ROBOT_VELOCITY_X = 80;

export class Robot extends PowerUp {
  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, ROBOT_VELOCITY_X, ROBOT_DIMENSIONS);
  }

  protected activate() {
    // Configure power up
    this.scene.powerUps.add(this);
    this.body.setVelocityY(PowerUp.ACTIVATE_VELOCITY_Y);

    // Play sounds
    this.scene.soundEffects.playEffect(Sounds.PowerUpAppears);

    // Play animation
    this.anims.play(PowerUpAnimations.Robot);
  }

  protected collect() {
    super.collect();
    this.upgradePlayer();
  }
}
