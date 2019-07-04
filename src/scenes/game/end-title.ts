import { FONT, MS_TO_S, TILE_SIZE } from '@game/config';
import { Colors } from '@game/models';

import { GameScene } from './game-scene';

const BLINK_TIME = 500;
const GAME_OVER_TEXT = 'GAME OVER';
const TIMEOUT_TEXT = 'TIMEOUT';
const FONT_SIZE = TILE_SIZE * 2;
const TITLE_TIME = 4 * MS_TO_S;

export class EndTitle {
  private timeoutSprite: Phaser.GameObjects.BitmapText;
  private gameOverSprite: Phaser.GameObjects.BitmapText;

  private blinkTimer: number;

  constructor(private scene: GameScene) {}

  update(delta: number) {
    if (this.timeoutSprite) {
      this.blinkTimer -= delta;

      if (this.blinkTimer <= 0) {
        this.timeoutSprite.setAlpha(this.timeoutSprite.alpha === 1 ? 0 : 1); // Toggle alpha
        this.blinkTimer = BLINK_TIME;
      }
    }

    if (this.gameOverSprite) {
      this.blinkTimer -= delta;

      if (this.blinkTimer <= 0) {
        this.gameOverSprite.setAlpha(this.gameOverSprite.alpha === 1 ? 0 : 1); // Toggle alpha
        this.blinkTimer = BLINK_TIME;
      }
    }
  }

  showTimeout() {
    const { width, height } = this.scene.getGameDimensions();

    this.timeoutSprite = this.scene.add
      .bitmapText(width / 2 - (TIMEOUT_TEXT.length * FONT_SIZE) / 2, height / 2 - FONT_SIZE / 2, FONT, TIMEOUT_TEXT, FONT_SIZE)
      .setTint(Colors.Red)
      .setScrollFactor(0, 0);

    this.blinkTimer = 2 * BLINK_TIME;
    setTimeout(() => this.scene.restart(), TITLE_TIME);
  }

  showGameOver() {
    const { width, height } = this.scene.getGameDimensions();

    this.gameOverSprite = this.scene.add
      .bitmapText(width / 2 - (GAME_OVER_TEXT.length * FONT_SIZE) / 2, height / 2 - FONT_SIZE / 2, FONT, GAME_OVER_TEXT, FONT_SIZE)
      .setTint(Colors.Red)
      .setScrollFactor(0, 0);

    this.blinkTimer = 2 * BLINK_TIME;
    setTimeout(() => this.scene.restart(), TITLE_TIME);
  }
}
