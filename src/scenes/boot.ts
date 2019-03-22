import { makeAnimations } from '../helpers/animations';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.createProgressBar();
    this.loadAssets();
  }

  createProgressBar() {
    const progress: Phaser.GameObjects.Graphics = this.add.graphics();

    this.load.on('progress', (value: number) => {
      progress.clear();
      progress.fillStyle(0xffffff, 1);
      progress.fillRect(0, this.sys.game.config.height / 2, this.sys.game.config.width * value, 60);
    });

    this.load.on('complete', () => {
      makeAnimations(this);
      progress.destroy();
      this.scene.start('TitleScene');
    });
  }

  loadAssets() {
    this.load.pack('preload', 'assets/pack.json', 'preload');
  }
}
