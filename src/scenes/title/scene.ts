import { SPRITES_KEY, TitleAnimations } from '@game/animations';
import { FONT } from '@game/config';
import { GameOptions } from '@game/models';

import { BaseScene } from '../base';
import { GameScene } from '../game';
import { START_SIZE, START_TEXT, START_X, START_Y, TITLE_BLINK_TIME, TITLE_Y } from './constants';

export class TitleScene extends BaseScene {
  static readonly SceneKey = 'TitleScene';

  private startSprite: Phaser.GameObjects.BitmapText;
  private blinkTimer: number = TITLE_BLINK_TIME * 2;

  constructor() {
    super({ key: TitleScene.SceneKey });
  }

  create() {
    this.createTitle();
    this.createAttractMode();
  }

  update(time: number, delta: number) {
    this.checkRestartAttractMode();
    this.blinkTitle(delta);
  }

  /**
   * Methods for attract mode
   */

  createAttractMode() {
    this.setRegistry(GameOptions.AttractMode, true);
    this.setRegistry(GameOptions.RestartScene, false);
    this.scene.launch(GameScene.SceneKey);
    this.scene.bringToTop();
  }

  checkRestartAttractMode() {
    if (this.getRegistry(GameOptions.RestartScene)) {
      this.scene.stop(GameScene.SceneKey);
      this.scene.launch(GameScene.SceneKey);
      this.scene.bringToTop(GameScene.SceneKey);
      this.setRegistry(GameOptions.RestartScene, false);
    }
  }

  startGame() {
    this.scene.stop(GameScene.SceneKey);
    this.setRegistry(GameOptions.AttractMode, false);
    this.scene.start(GameScene.SceneKey);
  }

  /**
   * Methods for the title
   */

  createTitle() {
    const { width } = this.gameConfig();
    const title: Phaser.GameObjects.Sprite = this.add.sprite(width / 2, TITLE_Y, SPRITES_KEY);
    title.play(TitleAnimations.Title);

    this.startSprite = this.add.bitmapText(START_X, START_Y, FONT, START_TEXT, START_SIZE);

    this.input.on('pointerdown', () => this.startGame());
    this.input.keyboard.on('keydown', () => this.startGame());
  }

  blinkTitle(delta: number) {
    this.blinkTimer -= delta;

    if (this.blinkTimer < 0) {
      this.startSprite.alpha = this.startSprite.alpha === 1 ? 0 : 1; // Toggle alpha
      this.blinkTimer = TITLE_BLINK_TIME; // Restart timer
    }
  }
}
