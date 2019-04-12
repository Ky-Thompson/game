import {
  makeBibleAnimations,
  makeGoombaAnimations,
  makeHUDAnimations,
  makePadAnimations,
  makePlayerAnimations,
  makePowerUpAnimations,
  makeTileAnimations,
  makeTitleAnimations,
  makeTurtleAnimations,
} from '@game/animations';
import { resizeGame } from '@game/helpers';
import { Colors, Players } from '@game/models';

import { BaseScene } from '../base';
import { TitleScene } from '../title';

const PROGRESS_BAR_HEIGHT = 120;

export class BootScene extends BaseScene {
  static readonly SceneKey = 'BootScene';

  constructor() {
    super({ key: BootScene.SceneKey });
  }

  preload() {
    this.createProgressBar();
    this.loadAssets();
  }

  /**
   * Methods for the scene
   */

  private createProgressBar() {
    const progress: Phaser.GameObjects.Graphics = this.add.graphics();
    const { height, width } = this.gameConfig();

    resizeGame();

    this.load.on('progress', (value: number) => {
      progress.clear();
      progress.fillStyle(Colors.White, 1);
      progress.fillRect(0, height / 2, width * value, PROGRESS_BAR_HEIGHT);
    });

    this.load.on('complete', () => {
      this.makeAnimations();
      progress.destroy();
      this.scene.start(TitleScene.SceneKey);
    });
  }

  /**
   * Assets and animations
   */

  private loadAssets() {
    this.load.pack('preload', 'assets/pack.json', 'preload');
  }

  private makeAnimations() {
    makePadAnimations(this);
    makeHUDAnimations(this);
    makeTitleAnimations(this);
    makeTileAnimations(this);

    makePlayerAnimations(this, Players.Caleb);
    makePlayerAnimations(this, Players.Sophia);
    makeBibleAnimations(this);

    makeGoombaAnimations(this);
    makeTurtleAnimations(this);
    makePowerUpAnimations(this);
  }
}
