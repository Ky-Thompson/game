import { TILE_SIZE } from '../../config';
import { GAME_TIMEOUT, HURRY_TIME, TIME_FACTOR } from './constants';
import { GameScene } from './game-scene';

const MS_TO_S = 1000;

export class HUD {
  private hud: Phaser.GameObjects.BitmapText;

  private timerText: Phaser.GameObjects.BitmapText;
  private time: number = GAME_TIMEOUT * MS_TO_S;
  private displayedTime: number = GAME_TIMEOUT;
  private hurry: boolean = false;

  private scoreText: Phaser.GameObjects.BitmapText;
  private score: number = 0;

  constructor(private scene: GameScene) {
    this.init();
  }

  private init() {
    this.hud = this.scene.add
      .bitmapText((5 * TILE_SIZE) / 2, TILE_SIZE / 2, 'font', 'CALEB                              TIME', TILE_SIZE / 2)
      .setScrollFactor(0, 0);

    this.timerText = this.scene.add.bitmapText((41 * TILE_SIZE) / 2, TILE_SIZE, 'font', '255', TILE_SIZE / 2).setScrollFactor(0, 0);
    this.scoreText = this.scene.add.bitmapText((5 * TILE_SIZE) / 2, TILE_SIZE, 'font', '000000', TILE_SIZE / 2).setScrollFactor(0, 0);

    if (this.scene.attractMode.isActive()) {
      this.hud.alpha = 0;
      this.timerText.alpha = 0;
      this.scoreText.alpha = 0;
    }
  }

  update(delta: number) {
    this.time -= delta * TIME_FACTOR;

    if (this.time / MS_TO_S - this.displayedTime < 1) {
      this.displayedTime = Math.round(this.time / MS_TO_S);
      this.timerText.setText(('' + this.displayedTime).padStart(3, '0'));

      // Hurry up if there is little time left
      if (this.displayedTime < HURRY_TIME && !this.hurry) {
        // TODO: Consider flashing timer
        this.hurry = true;
        this.scene.soundEffects.pauseMusic();
        this.scene.soundEffects.playEffect('smb_warning', () => {
          this.scene.soundEffects.resumeMusic();
          this.scene.soundEffects.setMusicRate(1.5);
        });
      }

      // Timeout
      if (this.displayedTime < 1) {
        this.scene.mario.die();
        this.hurry = false;
        this.scene.soundEffects.setMusicRate(1);
        this.time = GAME_TIMEOUT * MS_TO_S;
        this.displayedTime = GAME_TIMEOUT;
      }
    }
  }

  updateScore(score: number) {
    this.score += score;
    this.scoreText.setText(('' + this.score).padStart(6, '0'));
  }
}
