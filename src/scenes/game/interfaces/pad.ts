import { PadAnimations, SPRITES_KEY } from '@game/animations';
import { TILE_SIZE } from '@game/config';
import { ActionState, Colors, Depth, PlayerStates } from '@game/models';

import { GameScene } from '../scene';

const GAME_PAD_ALPHA = 0.9;

const BUTTON_SIZE = 3 * TILE_SIZE;
const PADDING = TILE_SIZE / 2;

export class GamePad {
  private readonly gamePad: Partial<ActionState> = {};
  private readonly rightButton: Phaser.GameObjects.Sprite;
  private readonly leftButton: Phaser.GameObjects.Sprite;
  private readonly upButton: Phaser.GameObjects.Sprite;
  private readonly throwBibleButton: Phaser.GameObjects.Sprite;

  constructor(private scene: GameScene) {
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
    const THROW_BIBLE_BUTTON_X = UP_BUTTON_X + BUTTON_SIZE + PADDING;
    const THROW_BIBLE_BUTTON_Y = RIGHT_BUTTON_Y;

    this.rightButton = this.scene.add.sprite(RIGHT_BUTTON_X, RIGHT_BUTTON_Y, SPRITES_KEY).play(PadAnimations.Right);
    this.leftButton = this.scene.add.sprite(LEFT_BUTTON_X, LEFT_BUTTON_Y, SPRITES_KEY).play(PadAnimations.Left);
    this.upButton = this.scene.add.sprite(UP_BUTTON_X, UP_BUTTON_Y, SPRITES_KEY).play(PadAnimations.Up);
    this.throwBibleButton = this.scene.add.sprite(THROW_BIBLE_BUTTON_X, THROW_BIBLE_BUTTON_Y, SPRITES_KEY).play(PadAnimations.A);

    [this.rightButton, this.leftButton, this.upButton, this.throwBibleButton].forEach((button) =>
      button
        .setScrollFactor(0, 0)
        .setDepth(Depth.HUD)
        .setAlpha(GAME_PAD_ALPHA)
        .setInteractive({ useHandCursor: true })
        .setDisplaySize(BUTTON_SIZE, BUTTON_SIZE)
        .on('pointerdown', () => button.setTint(Colors.Red))
        .on('pointerup', () => button.clearTint())
    );

    this.throwBibleButton.setAlpha(0); // Throw Bible button is hidden until available

    this.rightButton.on('pointerdown', () => (this.gamePad.right = true));
    this.rightButton.on('pointerup', () => (this.gamePad.right = false));

    this.leftButton.on('pointerdown', () => (this.gamePad.left = true));
    this.leftButton.on('pointerup', () => (this.gamePad.left = false));

    this.upButton.on('pointerdown', () => (this.gamePad.jump = true));
    this.upButton.on('pointerup', () => (this.gamePad.jump = false));

    this.throwBibleButton.on('pointerdown', () => (this.gamePad.throwBible = true));
    this.throwBibleButton.on('pointerup', () => (this.gamePad.throwBible = false));
  }

  private show() {
    return !this.scene.attractMode.isActive() && this.scene.isMobile();
  }

  getActions(): Partial<ActionState> {
    return this.gamePad;
  }

  update() {
    if (!this.show()) {
      return; // Don't update pad if not needed
    }

    this.throwBibleButton.setAlpha(this.scene.player.isPlayerState(PlayerStates.Super) ? GAME_PAD_ALPHA : 0);
  }
}
