import * as AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

import { TileAnimations } from '../../animations';
import { TILE_SIZE } from '../../config';
import { GameOptions, PlayerActions, Players, TileCallbacks, TiledGameObject } from '../../models';
import { BlockEmitter } from '../../sprites';
import { BounceBrick } from '../../sprites/brick';
import { Mario } from '../../sprites/mario';
import { PowerUp, PowerUps } from '../../sprites/power-up';
import { Turtle } from '../../sprites/turtle';
import { BaseScene } from '../base';
import { AttractMode } from './attract-mode';
import { COIN_SCORE, METALLIC_BLOCK_TILE, PLAYER_START_X } from './constants';
import { EnemyGroup } from './enemy-group';
import { FireballsGroup } from './fireballs-group';
import { HUD } from './hud';
import { Keyboard } from './keyboard';
import { ModifierGroup } from './modifiers-group';
import { SoundEffects } from './music';
import { GamePad } from './pad';
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
  hud: HUD;

  // Objects
  enemies: EnemyGroup;
  powerUps: PowerUpGroup;
  modifiers: ModifierGroup;
  fireballs: FireballsGroup;
  blockEmitter: BlockEmitter;
  bounceBrick: BounceBrick;

  // OLD

  private pluginsLodaded: boolean;

  readonly rooms: Room[] = []; // TODO: Refactor

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
    this.hud = new HUD(this);

    this.enemies = new EnemyGroup(this, this.world);
    this.powerUps = new PowerUpGroup(this, this.world);
    this.modifiers = new ModifierGroup(this, this.world);
    this.fireballs = new FireballsGroup(this);

    this.blockEmitter = new BlockEmitter(this);
    this.bounceBrick = new BounceBrick({ scene: this });

    this.createFinishLine();
    this.createPlayer();

    // If the game ended while physics was disabled
    this.physics.world.resume();
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
    this.fireballs.update(time, delta);

    if (this.physics.world.isPaused) {
      return;
    }

    this.updateFinishLine();
    this.hud.update(delta);
    this.enemies.update(time, delta); // TODO: Remove time from all
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

  private updateFinishLine() {
    if (this.mario.x > this.finishLine.x && this.finishLine.active) {
      this.removeFlag();
      this.physics.world.pause();
      return;
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
            this.hud.updateScore(COIN_SCORE);
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
