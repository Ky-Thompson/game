import { GtmEventTypes, pushEvent } from '@game/analytics';
import { SPRITES_KEY, TileAnimations } from '@game/animations';
import { TILE_SIZE } from '@game/config';
import { PlayerActions, Players, Sounds, TiledGameObject } from '@game/models';
import { GameScene, ScoreboardScene } from '@game/scenes';

const PLAYER_ANIMATION_DURATION = 1000;
const FLAG_ANIMATION_DURATION = 1500;
const DISAPPEAR_ANIMATION_DURATION = 500;
const SCOREBOARD_TIME = 2500;

export class FinishLine {
  private flag: Phaser.GameObjects.Sprite;
  private active: boolean = false;
  private started: boolean = false;

  constructor(private scene: GameScene, private finishLineTile: TiledGameObject, private endTile: TiledGameObject) {
    this.init();
  }

  private init() {
    const { x, y } = this.finishLineTile;
    this.flag = this.scene.add
      .sprite(x, y + TILE_SIZE, SPRITES_KEY)
      .setActive(false)
      .play(TileAnimations.Flag);
  }

  setActive(active: boolean) {
    this.active = active;
  }

  update() {
    if (this.succeeded() && !this.started) {
      this.climbDownFlag();
    } else if (this.ended()) {
      this.disappear();
    }
  }

  succeeded(): boolean {
    return this.scene.player.x >= this.finishLineTile.x && this.active;
  }

  private ended(): boolean {
    return this.scene.player.x > this.endTile.x && this.active;
  }

  private climbDownFlag() {
    this.started = true;

    this.scene.bibles.terminateAll();

    this.scene.soundEffects.pauseMusic();
    this.scene.soundEffects.playEffect(Sounds.FlagPole);

    this.scene.player.animate(PlayerActions.Climb);
    this.scene.player.x = this.finishLineTile.x;
    this.scene.player.body.setVelocity(0, 0);
    this.scene.player.body.setAcceleration(0, 0);

    this.scene.tweens.add({
      targets: this.flag,
      y: this.finishLineTile.y + this.finishLineTile.height - TILE_SIZE * 2,
      duration: FLAG_ANIMATION_DURATION,
      onComplete: () => this.playerWalk(),
    });

    this.scene.tweens.add({
      targets: this.scene.player,
      y: this.finishLineTile.y + this.finishLineTile.height - this.scene.player.body.height,
      duration: PLAYER_ANIMATION_DURATION,
    });

    this.scene.physics.world.pause();
  }

  private playerWalk() {
    this.scene.soundEffects.playEffect(Sounds.StageClear);
    this.scene.player.animate(PlayerActions.Walk, true);
    this.scene.player.setFlipX(false);
    this.scene.physics.world.resume();
  }

  private disappear() {
    this.scene.physics.world.pause();

    this.scene.tweens.add({
      targets: this.scene.player,
      alpha: 0,
      duration: DISAPPEAR_ANIMATION_DURATION,
      onComplete: async () => {
        const score: number = this.scene.hud.getScore();
        const player: Players = this.scene.player.getPlayerType();
        pushEvent({ event: GtmEventTypes.GameCompleted, score });

        try {
          await ScoreboardScene.SetLastScore(score, player);
          setTimeout(() => this.scene.goScoreboard(), SCOREBOARD_TIME);
        } catch (e) {
          console.error(e);
          this.scene.restart();
        }
      },
    });
  }
}
