import { makeAnimations } from '../helpers/animations';

export class BootScene extends Phaser.Scene {
  static readonly SceneKey = 'BootScene';

  constructor() {
    super({ key: BootScene.SceneKey });
  }

  preload() {
    this.createProgressBar();
    this.loadAssets();
  }

  createProgressBar() {
    const progress: Phaser.GameObjects.Graphics = this.add.graphics();

    this.load.on('progress', (value: number) => {
      progress.clear();
      progress.fillStyle(0xffffff, 1); // TODO: Define color
      progress.fillRect(0, this.sys.game.config.height / 2, this.sys.game.config.width * value, 60); // TODO: Use config
    });

    this.load.on('complete', () => {
      makeAnimations(this);
      progress.destroy();
      this.scene.start('TitleScene'); // TODO: Use static name
    });
  }

  loadAssets() {
    this.load.pack('preload', 'assets/pack.json', 'preload');
  }
}
