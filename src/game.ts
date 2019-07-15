/// <reference path="./phaser.d.ts"/>
import 'phaser';

import * as Sentry from '@sentry/browser';

import { GAME_HEIGHT, GAME_WIDTH, GRAVITY, TILE_SIZE } from './config';
import { BootScene, GameScene, ScoreboardScene, TitleScene } from './scenes';

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
  scale: {
    fullscreenTarget: document.documentElement,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: false,
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  input: {
    gamepad: true,
    activePointers: 6,
  },
  scene: [BootScene, TitleScene, GameScene, ScoreboardScene],
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
  }
}

let game: Game;

export function createGame() {
  if (!game) {
    try {
      game = new Game(config);
    } catch (e) {
      Sentry.captureException(e);

      // Show error
      var errorIE = document.getElementById('error-ie');
      errorIE.style.display = '';

      destroyGame();
    }
  }
}

export function destroyGame() {
  if (game) {
    try {
      game.destroy(true);
    } catch (e) {}

    game = undefined;
  }
}
