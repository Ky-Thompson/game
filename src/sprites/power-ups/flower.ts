import { PowerUpAnimations } from '@game/animations';
import { TILE_SIZE } from '@game/config';
import { Body, Depths, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

import { PowerUp } from './power-up';

const FLOWER_DIMENSIONS: Body = { width: 32, height: 32, x: 0, y: 0 };
const FLOWER_EASING = 'Quad.easeOut';

export class Flower extends PowerUp {
  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, PowerUp.VELOCITY_X, FLOWER_DIMENSIONS);
  }

  protected activate() {
    // Configure power up
    this.scene.powerUps.add(this);
    this.setDepth(Depths.Flower);
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.direction = 0;
    this.y += TILE_SIZE;
    this.scene.tweens.add({
      targets: this,
      ease: FLOWER_EASING,
      y: this.y - TILE_SIZE,
      duration: PowerUp.ANIMATION_DURATION,
    });

    // Play sounds
    this.scene.soundEffects.playEffect(Sounds.PowerUpAppears);

    // Play animation
    this.anims.play(PowerUpAnimations.Flower);
  }

  protected collect() {
    super.collect();

    this.scene.soundEffects.playEffect(Sounds.Life);
    this.scene.hud.updateLifes(1);
  }
}
