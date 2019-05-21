import { PadAnimations, SPRITES_KEY } from '@game/animations';
import { TILE_SIZE } from '@game/config';
import { ActionState, Colors, Depths, PlayerStates } from '@game/models';
import { GameScene } from './game-scene';

const GAME_PAD_ALPHA = 0.8;
const PAD_SIZE = TILE_SIZE * 5;
const BUTTON_SIZE = 3 * TILE_SIZE;
const PADDING = TILE_SIZE / 2;

const PAD_RADIUS_THRESHOLD = TILE_SIZE / 3;
const PAD_ANGLE_THRESHOLD = 60;

const PAD_RIGHT_DIRECTION = 0;
const PAD_LEFT_DIRECTION = 180;
const PAD_UP_DIRECTION = 90;
const PAD_DOWN_DIRECTION = 270;

export class VirtualPad {
  private readonly actions: Partial<ActionState> = {};
  private pad: Phaser.GameObjects.Sprite;
  private throwBibleButton: Phaser.GameObjects.Sprite;

  private lastPadAnimation: PadAnimations;

  constructor(private scene: GameScene) {
    if (!this.show()) {
      return; // Don't add pad if not needed
    }

    this.initPad();
    this.initThrowBibleButton();
  }

  private initPad() {
    const { height } = this.scene.getGameDimensions();

    const PAD_X = PAD_SIZE / 2 + PADDING;
    const PAD_Y = height - PAD_SIZE / 2 - PADDING;

    this.pad = this.scene.add
      .sprite(PAD_X, PAD_Y, SPRITES_KEY)
      .setScrollFactor(0, 0)
      .setDepth(Depths.HUD)
      .setAlpha(GAME_PAD_ALPHA)
      .play(PadAnimations.Default)
      .setDisplaySize(PAD_SIZE, PAD_SIZE)
      .setInteractive({ useHandCursor: true });

    this.pad.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      this.handlePointer(pointer);
      this.updatePad();
    });
    this.pad.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      this.handlePointer(pointer);
      this.updatePad();
    });
    this.pad.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      this.handlePointer(pointer);
      this.updatePad();
    });
    this.pad.on(Phaser.Input.Events.POINTER_OUT, (pointer: Phaser.Input.Pointer) => {
      this.handlePointer(pointer, true);
      this.updatePad();
    });
  }

  private initThrowBibleButton() {
    const { width, height } = this.scene.getGameDimensions();

    const THROW_BIBLE_BUTTON_X = width - BUTTON_SIZE / 2 - PADDING;
    const THROW_BIBLE_BUTTON_Y = height - BUTTON_SIZE / 2 - PADDING;

    this.throwBibleButton = this.scene.add
      .sprite(THROW_BIBLE_BUTTON_X, THROW_BIBLE_BUTTON_Y, SPRITES_KEY)
      .setScrollFactor(0, 0)
      .setDepth(Depths.HUD)
      .setAlpha(0) // Throw Bible button is hidden until available
      .play(PadAnimations.A)
      .setDisplaySize(BUTTON_SIZE, BUTTON_SIZE)
      .setInteractive({ useHandCursor: true });

    this.throwBibleButton.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.actions.throwBible = true;
      this.throwBibleButton.setTint(Colors.Red);
    });
    this.throwBibleButton.on(Phaser.Input.Events.POINTER_UP, () => {
      this.actions.throwBible = false;
      this.throwBibleButton.clearTint();
    });
  }

  private show() {
    return !this.scene.demo.isActive() && !this.scene.isScoreboardActive() && this.scene.isMobile();
  }

  getActions(): Partial<ActionState> {
    return this.actions;
  }

  update() {
    if (!this.show()) {
      return; // Don't update pad if not needed
    }

    this.throwBibleButton.setAlpha(this.scene.player.playerState === PlayerStates.Super ? GAME_PAD_ALPHA : 0);

    const anyPointersDown: boolean = this.scene.input.manager.pointers.reduce((prev, curr) => prev || curr.isDown, false);
    if (!anyPointersDown && this.lastPadAnimation !== PadAnimations.Default) {
      this.actions.left = false;
      this.actions.right = false;
      this.actions.jump = false;
      this.actions.down = false;
      this.updatePad();
    }
  }

  private handlePointer(pointer: Phaser.Input.Pointer, mouseOut: boolean = false) {
    this.actions.left = false;
    this.actions.right = false;
    this.actions.jump = false;
    this.actions.down = false;

    if (!pointer.isDown || mouseOut) {
      return;
    }

    const x = this.pad.x - pointer.x;
    const y = this.pad.y - pointer.y;
    const angle = ((Math.atan2(y, -x) * 180) / Math.PI + 360) % 360;
    const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

    if (radius < PAD_RADIUS_THRESHOLD) {
      return;
    }

    this.actions.right = this.directionActive(angle, PAD_RIGHT_DIRECTION);
    this.actions.jump = this.directionActive(angle, PAD_UP_DIRECTION);
    this.actions.left = this.directionActive(angle, PAD_LEFT_DIRECTION);
    this.actions.down = this.directionActive(angle, PAD_DOWN_DIRECTION);
  }

  private directionActive(angle: number, direction: number): boolean {
    const isRight: boolean = direction === 0;
    const lowerLimit: boolean = angle > (direction - PAD_ANGLE_THRESHOLD + 360) % 360;
    const upperLimit: boolean = angle < direction + PAD_ANGLE_THRESHOLD;
    return isRight ? lowerLimit || upperLimit : lowerLimit && upperLimit;
  }

  private updatePad() {
    let padAnimation: PadAnimations;

    if (this.actions.right && this.actions.jump) {
      padAnimation = PadAnimations.RightUp;
    } else if (this.actions.right && this.actions.down) {
      padAnimation = PadAnimations.RightDown;
    } else if (this.actions.right) {
      padAnimation = PadAnimations.Right;
    } else if (this.actions.left && this.actions.jump) {
      padAnimation = PadAnimations.LeftUp;
    } else if (this.actions.left && this.actions.down) {
      padAnimation = PadAnimations.LeftDown;
    } else if (this.actions.left) {
      padAnimation = PadAnimations.Left;
    } else if (this.actions.jump) {
      padAnimation = PadAnimations.Up;
    } else if (this.actions.down) {
      padAnimation = PadAnimations.Down;
    } else {
      padAnimation = PadAnimations.Default;
    }

    if (padAnimation !== this.lastPadAnimation) {
      this.pad.play(padAnimation);
      this.lastPadAnimation = padAnimation;
    }
  }
}
