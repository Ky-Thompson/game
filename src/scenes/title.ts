import { TitleAnimations } from '../animations';

export class TitleScene extends Phaser.Scene {
  private pressX: Phaser.GameObjects.BitmapText;
  private startKey: Phaser.Input.Keyboard.Key;
  private blink: number = 1000;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.createTitle();
    this.createAttractMode();
  }

  update(time: number, delta: number) {
    this.checkRestartAttractMode();
    this.blinkTitle(delta);

    if (this.startKey.isDown) {
      this.startGame();
    }
  }

  /**
   * Methods for the scene
   */

  createAttractMode() {
    this.registry.set('attractMode', true);
    this.registry.set('restartScene', false);
    this.scene.launch('GameScene');
    this.scene.bringToTop();
  }

  checkRestartAttractMode() {
    if (this.registry.get('restartScene')) {
      this.scene.stop('GameScene');
      this.scene.launch('GameScene');
      this.scene.bringToTop('GameScene');

      this.registry.set('restartScene', false);
    }
  }

  startGame() {
    this.scene.stop('GameScene');
    this.registry.set('attractMode', false);
    this.scene.start('GameScene');
  }

  /**
   * Methods for the title
   */

  createTitle() {
    const title: Phaser.GameObjects.Sprite = this.add.sprite(this.sys.game.config.width / 2, 16 * 5);
    title.play(TitleAnimations.Title);

    this.pressX = this.add.bitmapText(17 * 8 + 4, 8 * 16, 'font', 'PRESS TO START', 8);
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.input.on('pointerdown', () => {
      this.startGame();
    });
  }

  blinkTitle(delta: number) {
    this.blink -= delta;
    if (this.blink < 0) {
      this.pressX.alpha = this.pressX.alpha === 1 ? 0 : 1;
      this.blink = 500;
    }
  }
}
