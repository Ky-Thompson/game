/// <reference path="./phaser.d.ts"/>
import 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { resizeGame, setFullscreen } from './helpers';
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
      gravity: { y: 1600 },
      debug: false,
    },
  },
  input: {
    activePointers: 6,
  },
  scene: [BootScene, TitleScene, GameScene],
};

export class Game extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);
  }
}

window.addEventListener('load', () => {
  const game = new Game(config);

  // Allow multitouch
  game.input.addPointer();
  game.input.addPointer();
  game.input.addPointer();
  game.input.addPointer();
  game.input.addPointer();

  // Sound and fullscreen
  const setupSoundFullscreen = () => {
    setFullscreen();
    (<any>game.sound).context.resume();
  };

  game.input.addDownCallback(setupSoundFullscreen, true);

  // Resize
  resizeGame();
  window.addEventListener('resize', resizeGame, false);
});
