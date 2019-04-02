import { PadAnimations } from '../../../animations';
import { TILE_SIZE } from '../../../config';
import { ActionState, PlayerStates } from '../../../models';
import { GameScene } from '../game-scene';

const GAME_PAD_DEPTH = 100;
const GAME_PAD_ALPHA = 0.9;
const BUTTON_ACTIVE_COLOR = 0xff4d4d;

const BUTTON_SIZE = 3 * TILE_SIZE;
const PADDING = TILE_SIZE / 2;

export class GamePad {
  private gamePad: Partial<ActionState> = {};
  private rightButton: Phaser.GameObjects.Sprite;
  private leftButton: Phaser.GameObjects.Sprite;
  private upButton: Phaser.GameObjects.Sprite;
  private fireButton: Phaser.GameObjects.Sprite;

  constructor(private scene: GameScene) {
    this.init();
  }

  private init() {
    if (!this.show()) {
      return; // Don't add pad if not needed
    }

    const { width, height } = this.scene.gameConfig();

    const RIGHT_BUTTON_X = width - BUTTON_SIZE / 2 - PADDING;
    const RIGHT_BUTTON_Y = height - BUTTON_SIZE / 2 - PADDING;
    const LEFT_BUTTON_X = RIGHT_BUTTON_X - BUTTON_SIZE - PADDING;
    const LEFT_BUTTON_Y = RIGHT_BUTTON_Y;
    const UP_BUTTON_X = BUTTON_SIZE / 2 + PADDING;
    const UP_BUTTON_Y = RIGHT_BUTTON_Y;
    const FIRE_BUTTON_X = UP_BUTTON_X + BUTTON_SIZE + PADDING;
    const FIRE_BUTTON_Y = RIGHT_BUTTON_Y;

    this.rightButton = this.scene.add.sprite(RIGHT_BUTTON_X, RIGHT_BUTTON_Y).play(PadAnimations.Right);
    this.leftButton = this.scene.add.sprite(LEFT_BUTTON_X, LEFT_BUTTON_Y).play(PadAnimations.Left);
    this.upButton = this.scene.add.sprite(UP_BUTTON_X, UP_BUTTON_Y).play(PadAnimations.Up);
    this.fireButton = this.scene.add.sprite(FIRE_BUTTON_X, FIRE_BUTTON_Y).play(PadAnimations.A);

    [this.rightButton, this.leftButton, this.upButton, this.fireButton].forEach((button) =>
      button
        .setScrollFactor(0, 0)
        .setDepth(GAME_PAD_DEPTH)
        .setAlpha(GAME_PAD_ALPHA)
        .setInteractive({ useHandCursor: true })
        .setDisplaySize(BUTTON_SIZE, BUTTON_SIZE)
        .on('pointerdown', () => button.setTint(BUTTON_ACTIVE_COLOR))
        .on('pointerup', () => button.clearTint())
    );

    this.fireButton.setAlpha(0); // Fire button is hidden until available

    this.rightButton.on('pointerdown', () => (this.gamePad.right = true));
    this.rightButton.on('pointerup', () => (this.gamePad.right = false));

    this.leftButton.on('pointerdown', () => (this.gamePad.left = true));
    this.leftButton.on('pointerup', () => (this.gamePad.left = false));

    this.upButton.on('pointerdown', () => (this.gamePad.jump = true));
    this.upButton.on('pointerup', () => (this.gamePad.jump = false));

    this.fireButton.on('pointerdown', () => (this.gamePad.fire = true));
    this.fireButton.on('pointerup', () => (this.gamePad.fire = false));
  }

  private show() {
    const isAndroid: Boolean = !!navigator.userAgent.match(/Android/i);
    const isIOS: Boolean = !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
    const needsPad: Boolean = isAndroid || isIOS;
    return !this.scene.attractMode.isActive() && needsPad;
  }

  getActions(): Partial<ActionState> {
    return this.gamePad;
  }

  update() {
    if (!this.show()) {
      return; // Don't update pad if not needed
    }

    this.fireButton.setAlpha(this.scene.mario.playerState === PlayerStates.Fire ? GAME_PAD_ALPHA : 0);
  }
}
