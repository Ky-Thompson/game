import {
  makeBibleAnimations,
  makeCarAnimations,
  makeHUDAnimations,
  makeLiarAnimations,
  makePadAnimations,
  makePlayerAnimations,
  makePowerUpAnimations,
  makeTileAnimations,
  makeTitleAnimations,
} from '@game/animations';
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
    this.initProgressBar();
    this.loadAssets();
  }

  // Methods for the scene

  private initProgressBar() {
    const progress: Phaser.GameObjects.Graphics = this.add.graphics();
    const { height, width } = this.getGameDimensions();

    this.cameras.main.setBackgroundColor(Colors.Gray);

    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      progress.clear();
      progress.fillStyle(Colors.White, 1);
      progress.fillRect(0, (height - PROGRESS_BAR_HEIGHT) / 2, width * value, PROGRESS_BAR_HEIGHT);
    });

    this.load.on(Phaser.Loader.Events.COMPLETE, () => {
      this.makeAnimations();
      progress.destroy();
      this.scene.start(TitleScene.SceneKey);
    });
  }

  // Assets and animations

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

    makeLiarAnimations(this);
    makeCarAnimations(this);
    makePowerUpAnimations(this);
  }
}
