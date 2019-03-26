/// <reference path="./phaser.d.ts"/>
import 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene, GameScene, TitleScene } from './scenes';

const config: GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  input: {
    activePointers: 2,
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

(<any>window).resizeGame = () => {
  const canvas: HTMLCanvasElement = document.querySelector('canvas');
  const width: number = window.innerWidth;
  const height: number = window.innerHeight;
  const windowRatio: number = width / height;
  const gameRatio: number = GAME_WIDTH / GAME_HEIGHT;

  if (windowRatio < gameRatio) {
    canvas.parentElement.style.maxWidth = width + 'px';
    canvas.parentElement.style.maxHeight = width / gameRatio + 'px';
  } else {
    canvas.parentElement.style.maxWidth = height * gameRatio + 'px';
    canvas.parentElement.style.maxHeight = height + 'px';
  }
};

window.addEventListener('resize', (<any>window).resizeGame, false);
