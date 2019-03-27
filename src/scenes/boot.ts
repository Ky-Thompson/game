import {
  makeFireAnimations,
  makeGoombaAnimations,
  makePadAnimations,
  makePlayerAnimations,
  makePowerUpAnimations,
  makeTileAnimations,
  makeTitleAnimations,
  makeTurtleAnimations,
} from '../animations';
import { Players } from '../models';

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
      this.makeAnimations();
      progress.destroy();
      this.scene.start('TitleScene'); // TODO: Use static name
    });
  }

  loadAssets() {
    this.load.pack('preload', 'assets/pack.json', 'preload');
  }

  makeAnimations() {
    makePadAnimations(this);
    makeTitleAnimations(this);
    makeTileAnimations(this);

    makePlayerAnimations(this, Players.Mario);
    makePlayerAnimations(this, Players.Caleb);
    makePlayerAnimations(this, Players.Sophia);
    makeFireAnimations(this);

    makeGoombaAnimations(this);
    makeTurtleAnimations(this);
    makePowerUpAnimations(this);
  }
}
