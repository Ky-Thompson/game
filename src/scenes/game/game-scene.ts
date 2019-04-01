import * as AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

import { TileAnimations } from '../../animations';
import { TILE_SIZE } from '../../config';
import { GameOptions, PlayerActions, Players, TileCallbacks, TiledGameObject } from '../../models';
import { BlockEmitter } from '../../sprites';
import { BounceBrick } from '../../sprites/brick';
import { Fire } from '../../sprites/fire';
import { Mario } from '../../sprites/mario';
import { PowerUp, PowerUps } from '../../sprites/power-up';
import { Turtle } from '../../sprites/turtle';
import { BaseScene } from '../base';
import { AttractMode } from './attract-mode';
import { COIN_SCORE, GAME_TIMEOUT, METALLIC_BLOCK_TILE, PLAYER_START_X } from './constants';
import { EnemyGroup } from './enemy-group';
import { GamePad } from './game-pad';
import { Keyboard } from './keyboard';
import { ModifierGroup } from './modifiers-group';
import { SoundEffects } from './music';
import { PowerUpGroup } from './power-up-group';
import { World } from './world';

// TODO: Refactor

// TODO: Fix finish line for small size

export type Key = Phaser.Input.Keyboard.Key;

export interface Room {
  x: number;
  width: number;
  sky: string; // TODO: Rename to background
}

export interface Timer {
  textObject: Phaser.GameObjects.BitmapText;
  time: number;
  displayedTime: number;
  hurry: boolean;
}

export interface Score {
  textObject: Phaser.GameObjects.BitmapText;
  pts: number;
}

export interface FinishLine {
  flag: Phaser.GameObjects.Sprite;
  x: number;
  active: boolean;
}

export class GameScene extends BaseScene {
  static readonly SceneKey = 'GameScene';

  // Game
  attractMode: AttractMode;
  private gamePad: GamePad;
  private keyboard: Keyboard;
  world: World;
  soundEffects: SoundEffects;

  // Objects
  enemies: EnemyGroup;
  powerUps: PowerUpGroup;
  modifiers: ModifierGroup;
  private blockEmitter: BlockEmitter;

  // OLD

  private pluginsLodaded: boolean;

  readonly rooms: Room[] = [];

  fireballs: Phaser.GameObjects.Group; // TODO: Make private
  private bounceBrick;

  private levelTimer: Timer;
  private score: Score;
  private hud: Phaser.GameObjects.BitmapText;
  finishLine: FinishLine; // TODO: Make private
  mario: Mario; // TODO: rename

  constructor() {
    super({ key: GameScene.SceneKey });
  }

  preload() {
    if (!this.pluginsLodaded) {
      // TODO: Use enum
      this.load.scenePlugin('animatedTiles', AnimatedTiles, 'animatedTiles', 'animatedTiles');
      this.pluginsLodaded = true;
    }
  }

  create() {
    this.attractMode = new AttractMode(this);
    this.gamePad = new GamePad(this);
    this.keyboard = new Keyboard(this, this.gamePad);
    this.world = new World(this);
    this.soundEffects = new SoundEffects(this);

    this.enemies = new EnemyGroup(this, this.world);
    this.powerUps = new PowerUpGroup(this, this.world);
    this.modifiers = new ModifierGroup(this, this.world);

    this.blockEmitter = new BlockEmitter(this);
    this.bounceBrick = new BounceBrick({ scene: this });

    this.createFireballs();
    this.createHUD();
    this.createFinishLine();
    this.createPlayer();

    // If the game ended while physics was disabled
    this.physics.world.resume();
  }

  private createFireballs() {
    this.fireballs = this.add.group({
      classType: Fire,
      maxSize: 10,
      runChildUpdate: false, // Due to https://github.com/photonstorm/phaser/issues/3724
    });
  }

  private createHUD() {
    this.hud = this.add.bitmapText((5 * TILE_SIZE) / 2, TILE_SIZE / 2, 'font', 'CALEB                              TIME', TILE_SIZE / 2);
    this.hud.setScrollFactor(0, 0);

    this.levelTimer = {
      textObject: this.add.bitmapText((41 * TILE_SIZE) / 2, TILE_SIZE, 'font', '255', TILE_SIZE / 2).setScrollFactor(0, 0),
      time: GAME_TIMEOUT * 1000,
      displayedTime: 255,
      hurry: false,
    };

    this.score = {
      textObject: this.add.bitmapText((5 * TILE_SIZE) / 2, TILE_SIZE, 'font', '000000', TILE_SIZE / 2).setScrollFactor(0, 0),
      pts: 0,
    };

    if (this.attractMode.isActive()) {
      this.hud.alpha = 0;
      this.levelTimer.textObject.alpha = 0;
      this.score.textObject.alpha = 0;
    }
  }

  private createFinishLine() {
    let worldEndAt = -1;
    const { width } = this.world.size();
    for (let x = 0; x < width; x++) {
      let tile = this.world.getTileAt(x, 2); // Finish line must be in tile y=2
      if (tile && tile.properties['worldsEnd']) {
        worldEndAt = tile.pixelX;
        break;
      }
    }

    this.finishLine = {
      flag: this.add.sprite(worldEndAt + TILE_SIZE / 2, 4 * TILE_SIZE),
      x: worldEndAt,
      active: false,
    };
    this.finishLine.flag.play(TileAnimations.Flag);
  }

  private createPlayer() {
    this.mario = new Mario({
      scene: this,
      key: Players.Mario,
      x: TILE_SIZE * 6,
      y: this.sys.game.config.height - TILE_SIZE * 6, // TODO: Use level settings, or initial tile
    });

    // Set bounds for current room
    this.mario.setRoomBounds(this.rooms);

    // The camera should follow Mario
    this.cameras.main.startFollow(this.mario);

    this.cameras.main.roundPixels = true;
  }

  update(time: number, delta: number) {
    this.updateAttractMode(delta);
    this.updateFireballs(time, delta);

    if (this.physics.world.isPaused) {
      return;
    }

    this.updateFinishLine();
    this.updateTimer(delta);
    this.enemies.update(time, delta);
    this.powerUps.update(time, delta);

    this.mario.update(time, delta, this.attractMode.isActive() ? this.attractMode.getCurrentFrame().keys : this.keyboard.getActions());
    this.gamePad.update();
  }

  private updateAttractMode(delta: number) {
    if (!this.attractMode.isActive()) {
      return;
    }

    this.attractMode.update(delta);

    if (this.mario.y > this.sys.game.config.height || this.attractMode.hasEnded()) {
      this.attractMode.reset();
      this.mario.x = PLAYER_START_X;
      this.setRegistry(GameOptions.RestartScene, true);
      return;
    }

    if (this.attractMode.isNewFrame()) {
      this.attractMode.goNextFrame();
      const { x, y, vx, vy } = this.attractMode.getCurrentFrame();

      this.mario.x = x;
      this.mario.y = y;
      this.mario.body.setVelocity(vx, vy);
    }
  }

  private updateFireballs(time: number, delta: number) {
    Array.from(this.fireballs.children.entries).forEach((fireball: Fire) => {
      fireball.update(time, delta);
    });
  }

  private updateFinishLine() {
    if (this.mario.x > this.finishLine.x && this.finishLine.active) {
      this.removeFlag();
      this.physics.world.pause();
      return;
    }
  }

  private updateTimer(delta: number) {
    this.levelTimer.time -= delta * 2;

    if (this.levelTimer.time - this.levelTimer.displayedTime * 1000 < 1000) {
      this.levelTimer.displayedTime = Math.round(this.levelTimer.time / 1000);
      this.levelTimer.textObject.setText((<any>('' + this.levelTimer.displayedTime)).padStart(3, '0'));
      if (this.levelTimer.displayedTime < 40 && !this.levelTimer.hurry) {
        this.levelTimer.hurry = true;
        this.soundEffects.pauseMusic();
        this.soundEffects.playEffect('smb_warning', () => {
          this.soundEffects.resumeMusic();
          this.soundEffects.setMusicRate(1.5);
        });
      }
      if (this.levelTimer.displayedTime < 1) {
        this.mario.die();
        this.levelTimer.hurry = false;
        (<any>this.soundEffects).rate = 1;
        this.levelTimer.time = 150 * 1000;
        this.levelTimer.displayedTime = 255;
      }
    }
  }

  tileCollision(sprite: Phaser.GameObjects.Sprite, tile: TiledGameObject) {
    if (sprite instanceof Turtle) {
      // Turtles ignore the ground
      if (tile.y > Math.round(sprite.y / TILE_SIZE)) {
        return;
      }
    } else if (sprite instanceof Mario) {
      // Mario is bending on a pipe that leads somewhere:
      if (sprite.bending && tile.properties.pipe && tile.properties.dest) {
        sprite.enterPipe(tile.properties.dest, tile.properties.direction);
      }

      // If it's Mario and the body isn't blocked up it can't hit question marks or break bricks
      // Otherwise Mario will break bricks he touch from the side while moving up.
      if (!sprite.body.blocked.up) {
        return;
      }
    }

    // If the tile has a callback, lets fire it
    if (tile.properties.callback) {
      switch (tile.properties.callback) {
        case TileCallbacks.QuestionMark:
          tile.index = METALLIC_BLOCK_TILE; // Shift to a metallic block
          this.bounceBrick.restart(tile); // Bounce it a bit
          delete tile.properties.callback;
          tile.setCollision(true); // Invincible blocks are only collidable from above, but everywhere once revealed

          // Check powerUp for what to do, make a coin if not defined
          let powerUp = tile.properties.powerUp ? tile.properties.powerUp : PowerUps.Coin; // TODO: Refactor powerUp, split powerUps

          // Make powerUp (including a coin)
          const newPowerUp = new PowerUp({
            scene: this,
            key: 'sprites16',
            x: tile.x * TILE_SIZE + TILE_SIZE / 2,
            y: tile.y * TILE_SIZE - TILE_SIZE / 2,
            type: powerUp,
          });

          break;
        case TileCallbacks.Breakable:
          if (sprite instanceof Mario && sprite.playerState === '') {
            // Can't break it anyway. Bounce it a bit.
            this.bounceBrick.restart(tile);
            this.sound.playAudioSprite('sfx', 'smb_bump');
          } else {
            // Get points
            this.updateScore(COIN_SCORE);
            this.world.removeTileAt(tile.x, tile.y);
            this.sound.playAudioSprite('sfx', 'smb_breakblock');
            this.blockEmitter.emit(tile.x * TILE_SIZE, tile.y * TILE_SIZE);
          }
          break;
        default:
          this.sound.playAudioSprite('sfx', 'smb_bump');
          break;
      }
    } else {
      this.sound.playAudioSprite('sfx', 'smb_bump');
    }
  }
  static COIN_SCORE(COIN_SCORE: any): any {
    throw new Error('Method not implemented.');
  }

  updateScore(score: number) {
    this.score.pts += score;
    this.score.textObject.setText(('' + this.score.pts).padStart(6, '0'));
  }

  private removeFlag(step: number = 0) {
    // TODO: Use enum for steps
    switch (step) {
      case 0:
        this.soundEffects.pauseMusic();
        this.sound.playAudioSprite('sfx', 'smb_flagpole');
        this.mario.animate(PlayerActions.Climb);
        this.mario.x = this.finishLine.x - 1;
        this.tweens.add({
          targets: this.finishLine.flag,
          y: 240 * 2 - (6 * TILE_SIZE) / 2,
          duration: 1500,
          onComplete: () => this.removeFlag(1),
        });
        this.tweens.add({
          targets: this.mario,
          y: 240 * 2 - 3 * TILE_SIZE,
          duration: 1000,
          onComplete: () => {
            this.mario.flipX = true;
            this.mario.x += 11;
          },
        });
        break;
      case 1:
        let sound: any = this.sound.addAudioSprite('sfx');
        (<any>sound).on('ended', (sound) => {
          sound.destroy();
          this.scene.start('TitleScene');
        });
        sound.play('smb_stage_clear');

        this.mario.animate(PlayerActions.Walk);

        this.mario.flipX = false;
        this.tweens.add({
          targets: this.mario,
          x: this.finishLine.x + 6 * TILE_SIZE,
          duration: 1000,
          onComplete: () => this.removeFlag(2),
        });
        break;
      case 2:
        // TODO: fix y position
        this.tweens.add({
          targets: this.mario,
          alpha: 0,
          duration: 500,
        });
        break;
    }
  }
}
