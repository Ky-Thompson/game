/// <reference path="./phaser.d.ts"/>
import 'phaser';

import { GAME_HEIGHT, GAME_WIDTH, GRAVITY, TILE_SIZE } from './config';
import { initApp } from './firebase';
import { resizeGame, setFullscreen } from './helpers';
import { BootScene, GameScene, TitleScene } from './scenes';

const config: GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false,
      tileBias: TILE_SIZE,
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  input: {
    activePointers: 6,
  },
  scene: [BootScene, TitleScene, GameScene],
  disableContextMenu: true,
};

export class Game extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);

    // Allow multitouch
    this.input.addPointer();
    this.input.addPointer();
    this.input.addPointer();
    this.input.addPointer();
    this.input.addPointer();

    // Sound and fullscreen
    const setupSoundFullscreen = () => {
      setFullscreen();
      (<any>this.sound).context.resume();
    };

    this.input.addDownCallback(setupSoundFullscreen, true);

    // Resize
    resizeGame();
    window.addEventListener('resize', resizeGame, false);
  }
}

window.addEventListener('load', () => {
  initApp().then((user) => {
    const game = new Game(config);
    console.log(user);
  });
});
