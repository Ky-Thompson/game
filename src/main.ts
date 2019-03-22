/// <reference path="./phaser.d.ts"/>
import 'phaser';

import { BootScene, GameScene, TitleScene } from './scenes';

const config: GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  parent: 'content',
  width: 400,
  height: 240,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, GameScene],
};

export class Game extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);
  }
}

window.addEventListener('load', () => {
  new Game(config);
});
