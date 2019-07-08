import { FONT, TILE_SIZE } from '@game/config';
import { isEnter, isEscape } from '@game/firebase';
import { Colors, Depths, GameOptions } from '@game/models';

import { GamepadButtons } from '../base';
import { GameScene } from './game-scene';

const MENU_BACKGROUND_ALPHA = 0.8;
const PAUSED_TEXT = 'PAUSED';
const PAUSED_FONT_SIZE = TILE_SIZE;
const EXIT_TEXT = 'EXIT';
const EXIT_FONT_SIZE = TILE_SIZE * 2;
const BLINK_TIME = 500;

export class Menu {
  private backdrop: Phaser.GameObjects.Rectangle;
  private pausedSprite: Phaser.GameObjects.BitmapText;
  private exitSprite: Phaser.GameObjects.BitmapText;
  private prevPhysicsPaused: boolean;
  private visible: boolean;
  private blinkTimer: number;

  constructor(private scene: GameScene) {
    this.initMenu();
  }

  private initMenu() {
    const { width, height } = this.scene.getGameDimensions();

    this.visible = false;
    this.backdrop = this.scene.add
      .rectangle(width / 2, height / 2, width, height, Colors.Gray, MENU_BACKGROUND_ALPHA)
      .setScrollFactor(0, 0)
      .setActive(false)
      .setVisible(false)
      .setDepth(Depths.Menu);

    this.pausedSprite = this.scene.add
      .bitmapText(
        width / 2 - (PAUSED_TEXT.length * PAUSED_FONT_SIZE) / 2,
        height / 2 - PAUSED_FONT_SIZE / 2 - PAUSED_FONT_SIZE,
        FONT,
        PAUSED_TEXT,
        PAUSED_FONT_SIZE
      )
      .setScrollFactor(0, 0)
      .setVisible(false)
      .setDepth(Depths.Menu);

    this.exitSprite = this.scene.add
      .bitmapText(
        width / 2 - (EXIT_TEXT.length * EXIT_FONT_SIZE) / 2,
        height / 2 - EXIT_FONT_SIZE / 2 + EXIT_FONT_SIZE,
        FONT,
        EXIT_TEXT,
        EXIT_FONT_SIZE
      )
      .setScrollFactor(0, 0)
      .setTint(Colors.Red)
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .setDepth(Depths.Menu);

    this.exitSprite.on(Phaser.Input.Events.POINTER_DOWN, () => this.scene.restart());

    this.scene.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, (event: KeyboardEvent) => {
      if (isEscape(event)) {
        this.toggle();
      } else if (this.visible && isEnter(event)) {
        this.scene.restart();
      }
    });
  }

  update(delta: number) {
    if (!this.visible) {
      return;
    }

    this.blinkTimer -= delta;

    if (this.blinkTimer <= 0) {
      this.exitSprite.setAlpha(this.exitSprite.alpha === 1 ? 0.05 : 1); // Toggle alpha
      this.blinkTimer = BLINK_TIME;
    }
  }

  private toggle() {
    if (this.scene.getRegistry(GameOptions.Title) || this.scene.isScoreboardActive() || !this.scene.player.isAlive()) {
      if (this.visible) {
        this.hide();
      }
      return;
    }

    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private show() {
    this.prevPhysicsPaused = this.scene.physics.world.isPaused;
    this.scene.physics.world.pause();
    this.scene.anims.pauseAll();

    this.visible = true;
    this.backdrop.setVisible(true);
    this.pausedSprite.setVisible(true);
    this.exitSprite.setVisible(true);

    this.blinkTimer = BLINK_TIME;
    this.exitSprite.setAlpha(1);
  }

  private hide() {
    if (!this.prevPhysicsPaused) {
      this.scene.physics.resume();
    }
    this.scene.anims.resumeAll();

    this.visible = false;
    this.backdrop.setVisible(false);
    this.pausedSprite.setVisible(false);
    this.exitSprite.setVisible(false);
  }

  handleGamepadPressed(gamepadButton: GamepadButtons) {
    switch (gamepadButton) {
      case GamepadButtons.Start:
        this.toggle();
        break;

      case GamepadButtons.A:
        if (this.visible) {
          this.scene.restart();
        }
        break;
    }
  }
}
