import { ActionKeys, ActionState } from '../../models';
import { GamePad } from './game-pad';
import { GameScene } from './game-scene';

export class Keyboard {
  private keys: ActionKeys;

  constructor(private scene: GameScene, private gamePad: GamePad) {
    this.init();
  }

  private init() {
    this.keys = {
      jump: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      jump2: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      fire: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      player: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
    };
  }

  getActions(): Partial<ActionState> {
    const gamePadKeys = this.gamePad.getActions();

    return {
      left: this.keys.left.isDown || gamePadKeys.left,
      right: this.keys.right.isDown || gamePadKeys.right,
      down: this.keys.down.isDown,
      jump: this.keys.jump.isDown || this.keys.jump2.isDown || gamePadKeys.jump,
      fire: this.keys.fire.isDown || gamePadKeys.fire,
      player: this.keys.player.isDown,
    };
  }
}
