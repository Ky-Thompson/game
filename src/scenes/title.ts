export class TitleScene extends Phaser.Scene {
  private pressX: Phaser.GameObjects.BitmapText;
  private startKey: Phaser.Input.Keyboard.Key;
  private blink: number = 1000;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.fitScreen();
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

  fitScreen() {
    const height: number = window.screen.availHeight;
    const width: number = window.screen.availWidth;

    let multiplier = 1;

    if (height / width > 0.6) {
      multiplier = width / this.sys.game.config.width;
    } else {
      multiplier = height / this.sys.game.config.height;
    }

    multiplier = Math.floor(multiplier);

    const el = document.getElementsByTagName('canvas')[0];
    el.style.width = 400 * multiplier + 'px';
    el.style.height = 240 * multiplier + 'px';
  }

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
    this.anims.create({
      key: 'title',
      frames: [{ frame: 'title', key: 'mario-sprites' }],
    });

    const title: Phaser.GameObjects.Sprite = this.add.sprite(this.sys.game.config.width / 2, 16 * 5);
    title.play('title');

    this.pressX = this.add.bitmapText(16 * 8 + 4, 8 * 16, 'font', 'PRESS X TO START', 8);
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
