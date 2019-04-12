import { ActionKeys, ActionState } from '@game/models';

import { GameScene } from '../scene';
import { GamePad } from './pad';

export class Keyboard {
  private readonly keys: ActionKeys;

  constructor(private scene: GameScene, private gamePad: GamePad) {
    this.keys = {
      jump: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      jump2: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      throwBible: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
    };
  }

  getActions(): Partial<ActionState> {
    const gamePadKeys = this.gamePad.getActions();

    return {
      left: this.keys.left.isDown || gamePadKeys.left,
      right: this.keys.right.isDown || gamePadKeys.right,
      down: this.keys.down.isDown,
      jump: this.keys.jump.isDown || this.keys.jump2.isDown || gamePadKeys.jump,
      throwBible: this.keys.throwBible.isDown || gamePadKeys.throwBible,
    };
  }
}
