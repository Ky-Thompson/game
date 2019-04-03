import { SPRITES_KEY, TileAnimations } from '@game/animations';
import { TILE_SIZE } from '@game/config';
import { PlayerActions, Sounds, TiledGameObject } from '@game/models';
import { GameScene } from '@game/scenes';

enum FinishLineSteps {
  Climb = 'climb',
  Walk = 'walk',
  Disappear = 'disappear',
}

const PLAYER_ANIMATION_DURATION = 1000;
const FLAG_ANIMATION_DURATION = 1500;
const DISAPPEAR_ANIMATION_DURATION = 500;
const WALK_DISTANCE = 6 * TILE_SIZE;

export class FinishLine {
  private sprite: Phaser.GameObjects.Sprite;
  private active: boolean = false;

  constructor(private scene: GameScene, private finishLineTile: TiledGameObject) {
    this.init();
  }

  private init() {
    const { x, y } = this.finishLineTile;
    this.sprite = this.scene.add.sprite(x, y + TILE_SIZE, SPRITES_KEY);
    this.sprite.play(TileAnimations.Flag);
  }

  setActive(active: boolean) {
    this.active = active;
  }

  update(delta: number) {
    if (this.scene.player.x > this.finishLineTile.x && this.active) {
      this.removeFlag();
      this.scene.physics.world.pause();
    }
  }

  private removeFlag(step: FinishLineSteps = FinishLineSteps.Climb) {
    switch (step) {
      case FinishLineSteps.Climb:
        this.scene.soundEffects.pauseMusic();
        this.scene.soundEffects.playEffect(Sounds.FlagPole);

        this.scene.player.animate(PlayerActions.Climb);
        this.scene.player.x = this.finishLineTile.x;

        this.scene.tweens.add({
          targets: this.sprite,
          y: this.finishLineTile.y + this.finishLineTile.height - TILE_SIZE * 2,
          duration: FLAG_ANIMATION_DURATION,
          onComplete: () => this.removeFlag(FinishLineSteps.Walk),
        });

        this.scene.tweens.add({
          targets: this.scene.player,
          y: this.finishLineTile.y + this.finishLineTile.height - this.scene.player.body.height,
          duration: PLAYER_ANIMATION_DURATION,
          onComplete: () => (this.scene.player.flipX = false),
        });
        break;

      case FinishLineSteps.Walk:
        this.scene.soundEffects.playEffect(Sounds.StageClear);

        this.scene.player.animate(PlayerActions.Walk, true);

        this.scene.player.flipX = false;
        this.scene.tweens.add({
          targets: this.scene.player,
          x: this.finishLineTile.x + WALK_DISTANCE,
          duration: PLAYER_ANIMATION_DURATION,
          onComplete: () => this.removeFlag(FinishLineSteps.Disappear),
        });
        break;

      case FinishLineSteps.Disappear:
        this.scene.tweens.add({
          targets: this.scene.player,
          alpha: 0,
          duration: DISAPPEAR_ANIMATION_DURATION,
          onComplete: () => this.scene.restart(),
        });
        break;
    }
  }
}
