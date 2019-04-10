import { PowerUpAnimations, SPRITES_KEY } from '@game/animations';
import { Body, Scores, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

const DIMENSIONS: Partial<Body> = { width: 32, height: 32 }; // TODO: Refactor and unify

export class Candy extends Phaser.GameObjects.Sprite {
  body: Phaser.Physics.Arcade.Body;

  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, SPRITES_KEY);

    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.body.allowGravity = false;
    this.play(PowerUpAnimations.Candy);
    this.body.setSize(DIMENSIONS.width, DIMENSIONS.height);
  }

  update() {
    this.scene.physics.world.overlap(this, this.scene.player, () => this.collect());
  }

  collect() {
    this.scene.hud.updateScore(Scores.Candy);
    this.scene.soundEffects.playEffect(Sounds.Candy);
    this.scene.powerUps.remove(this);
    this.destroy();
  }
}
