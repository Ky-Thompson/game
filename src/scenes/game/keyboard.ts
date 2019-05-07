import { ActionKeys, ActionState } from '@game/models';

import { GameScene } from './game-scene';
import { VirtualPad } from './pad';

export class Keyboard {
  private readonly keys: ActionKeys;

  constructor(private scene: GameScene, private virtualPad: VirtualPad) {
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
    const virtualPadKeys: Partial<ActionState> = this.virtualPad.getActions();
    const gamepadKeys: Partial<ActionState> = this.scene.getGamepadActions();

    return {
      left: this.keys.left.isDown || virtualPadKeys.left || gamepadKeys.left,
      right: this.keys.right.isDown || virtualPadKeys.right || gamepadKeys.right,
      down: this.keys.down.isDown || virtualPadKeys.down || gamepadKeys.down,
      jump: this.keys.jump.isDown || this.keys.jump2.isDown || virtualPadKeys.jump || gamepadKeys.jump,
      throwBible: this.keys.throwBible.isDown || virtualPadKeys.throwBible || gamepadKeys.throwBible,
    };
  }
}
