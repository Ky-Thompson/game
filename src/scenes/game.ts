import * as AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

import { PadAnimations } from '../helpers/animations';
import { BounceBrick } from '../sprites/brick';
import { Enemy } from '../sprites/enemy';
import { Fire } from '../sprites/fire';
import { Goomba } from '../sprites/goomba';
import { Mario, PipeDirection, Players } from '../sprites/mario';
import { PowerUp, PowerUps } from '../sprites/power-up';
import { Turtle } from '../sprites/turtle';

// TODO: Refactor

// TODO: Fix finish line for small size

export type Key = Phaser.Input.Keyboard.Key;
export type Actions = 'jump' | 'jump2' | 'fire' | 'left' | 'right' | 'down' | 'player';
export type ActionKeys = { [key in Actions]: Phaser.Input.Keyboard.Key };
export type ActionState = { [key in Actions]: boolean };

export enum GameOptions {
  AttractMode = 'attractMode',
  RestartScene = 'restartScene',
}

export interface AttractMode {
  recording: any; // TODO: Type
  current: number;
  time: 0;
}

export type Destinations = { [id: string]: Destination };
export type Destination = any;

export interface Room {
  x: number;
  width: number;
  sky: string; // TODO: Rename to background
}

export type TileProperties = {
  callback?: TileCallbacks;
  // TODO: Type other properties
  [key: string]: any;
};

export interface TiledGameObject extends Phaser.GameObjects.GameObject {
  gid?: number;
  index?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: TileProperties;
  powerUp?: PowerUps; // TODO: Remove
  setCollision: (recalculateFaces?: boolean) => Phaser.Tilemaps.Tile;
}

export enum Modifiers {
  PowerUp = 'powerUp',
  Pipe = 'pipe',
  Destination = 'dest',
  Room = 'room',
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

export enum TileCallbacks {
  QuestionMark = 'questionMark',
  Breakable = 'breakable',
  Toggle16Bit = 'toggle16bit',
}

export class GameScene extends Phaser.Scene {
  static GAME_TIMEOUT = 150;
  static COIN_SCORE = 50; // Move to a common file
  static METALLIC_BLOCK_TILE = 44; // TODO: get from somewhere else

  private pluginsLodaded: boolean;
  private eightBit: boolean = true;
  readonly destinations: Destinations = {};
  readonly rooms: Room[] = [];
  music: Phaser.Sound.BaseSound; // TODO: Make private
  private map: Phaser.Tilemaps.Tilemap;
  private tileset: Phaser.Tilemaps.Tileset;
  backgroundLayer: Phaser.Tilemaps.StaticTilemapLayer;
  groundLayer: Phaser.Tilemaps.DynamicTilemapLayer;
  enemyGroup: Phaser.GameObjects.Group; // TODO: Make private
  powerUps: Phaser.GameObjects.Group; // TODO: Make private
  fireballs: Phaser.GameObjects.Group; // TODO: Make private
  private bounceTile;
  private keys: ActionKeys;
  private pad: Partial<ActionState> = {};
  private blockEmitter: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private attractMode: AttractMode;
  private levelTimer: Timer;
  private score: Score;
  private hud: Phaser.GameObjects.BitmapText;
  finishLine: FinishLine; // TODO: Make private
  mario: Mario; // TODO: rename

  constructor() {
    super({ key: 'GameScene' });
  }

  private getRegistry(option: GameOptions) {
    return this.registry.get(String(option));
  }
  private setRegistry(option: GameOptions, value: any) {
    return this.registry.set(String(option), value);
  }

  preload() {
    if (!this.pluginsLodaded) {
      this.load.scenePlugin('animatedTiles', AnimatedTiles, 'animatedTiles', 'animatedTiles');
      this.pluginsLodaded = true;
    }
  }

  create() {
    this.createAttractMode();
    this.createMusic();
    this.createWorld();
    this.createEnemies();
    this.createModifiers();
    this.createPad();
    this.createInputKeys();
    this.createBlocks();
    this.createFireballs();
    this.createHUD();
    this.createFinishLine();
    this.createPlayer();

    // If the game ended while physics was disabled
    this.physics.world.resume();
  }

  private createAttractMode() {
    if (this.getRegistry(GameOptions.AttractMode)) {
      this.attractMode = {
        recording: this.sys.cache.json.entries.entries.attractMode,
        current: 0,
        time: 0,
      };
    } else {
      this.attractMode = null;
    }
  }

  private createMusic() {
    if (!this.attractMode) {
      this.music = this.sound.add('overworld');
      this.music.play({ loop: true });
    }
  }

  private createWorld() {
    this.map = this.make.tilemap({ key: 'map' });
    (<any>this.sys).animatedTiles.init(this.map);

    this.tileset = this.map.addTilesetImage('SuperMarioBros-World1-1', 'tiles-16bit'); // TODO: Rename
    this.backgroundLayer = this.map.createStaticLayer('background', this.tileset, 0, 0);
    this.groundLayer = this.map.createDynamicLayer('world', this.tileset, 0, 0);
    this.add.tileSprite(0, 0, this.groundLayer.width, 500, 'background-clouds');
    this.add.tileSprite(0, 0, this.backgroundLayer.width, 500, 'background-clouds').setDepth(-1); // Fix background color

    this.physics.world.bounds.width = this.groundLayer.width;
    this.groundLayer.setCollisionByExclusion([-1], true);
  }

  private createEnemies() {
    this.enemyGroup = this.add.group();

    this.map.getObjectLayer('enemies').objects.forEach((enemy: TiledGameObject) => {
      const tileProperties = this.getTilesetProperties(enemy);

      switch (tileProperties.name) {
        case 'goomba': // TODO: Refactor sprit to be generic
          this.enemyGroup.add(new Goomba({ scene: this, key: 'sprites16', x: enemy.x, y: enemy.y }));
          break;
        case 'turtle':
          this.enemyGroup.add(new Turtle({ scene: this, key: 'mario-sprites', x: enemy.x, y: enemy.y }));
          break;
      }
    });
  }

  private createModifiers() {
    this.powerUps = this.add.group();

    // TODO: Split powerups and modifiers in different layers

    this.map.getObjectLayer('modifiers').objects.forEach((modifier: TiledGameObject) => {
      let tile, type, properties;

      if (modifier.gid) {
        properties = this.getTilesetProperties(modifier);
        type = properties.type;
        if (properties.hasOwnProperty('powerUp')) {
          type = 'powerUp'; // TODO: Use type in tiled
        }
      } else {
        this.consolidateProperties(modifier);
        type = modifier.properties.type;
      }

      // TODO: Move modifiers to a separate file in /modifiers and /powerUps
      switch (type) {
        case Modifiers.PowerUp:
          // Modifies a questionmark below the modifier to contain something else than the default (coin)
          tile = this.groundLayer.getTileAt(modifier.x / 16, modifier.y / 16 - 1);
          tile.powerUp = properties.powerUp; // TODO: Refactor
          tile.properties.callback = 'questionMark';
          break;
        case Modifiers.Pipe:
          // Adds info on where to go from a pipe under the modifier
          for (let x = 0; x < modifier.width / 16; x++) {
            for (let y = 0; y < modifier.height / 16; y++) {
              tile = this.groundLayer.getTileAt(modifier.x / 16 + x, modifier.y / 16 + y);
              tile.properties.dest = parseInt(modifier.properties.goto);
              tile.properties.direction = modifier.properties.direction;
              tile.properties.pipe = true;
            }
          }

          break;
        case Modifiers.Destination:
          const id = modifier.properties.id;
          const direction = modifier.properties.direction;

          // Calculate coordinates where the player should appear
          let x: number = 0;
          let y: number = 0;

          switch (direction) {
            case PipeDirection.Right:
              x = modifier.width;
              y = modifier.height / 2;
              break;
            case PipeDirection.Left:
              x = 0;
              y = modifier.height / 2;
              break;
            case PipeDirection.Up:
              x = modifier.width / 2;
              y = 0;
              break;
            case PipeDirection.Down:
              x = modifier.width / 2;
              y = -modifier.height;
              break;
          }

          // Adds a destination so that a pipe can find it
          this.destinations[id] = {
            x: modifier.x + x,
            y: modifier.y + y,
            top: modifier.y < 16,
            direction: direction,
          };
          break;
        case Modifiers.Room:
          // Adds a 'room' that is just info on bounds so that we can add sections below pipes
          // in an level just using one tilemap.
          this.rooms.push({
            x: modifier.x,
            width: modifier.width,
            sky: modifier.properties.sky,
          });
          break;
      }
    });
  }

  private consolidateProperties(tile: TiledGameObject) {
    // TODO: Move to helper
    if (Array.isArray(tile.properties)) {
      const properties = {};
      tile.properties.forEach((prop) => {
        properties[prop.name] = prop.value;
      });
      tile.properties = properties;
    }
  }

  private getTilesetProperties(tile: TiledGameObject): TileProperties {
    // TODO: Move to helper
    return this.tileset.tileProperties[tile.gid - 1];
  }

  private createPad() {
    const isAndroid: Boolean = !!navigator.userAgent.match(/Android/i);
    const isIOS: Boolean = !!navigator.userAgent.match(/iPhone|iPad|iPod/i);

    if (!isAndroid && !isIOS) {
      return; // Don't add pad if not needed
    }

    const rightButton: Phaser.GameObjects.Sprite = this.add.sprite(365, 205).play(PadAnimations.Right);
    const leftButton: Phaser.GameObjects.Sprite = this.add.sprite(305, 205).play(PadAnimations.Left);
    const upButton: Phaser.GameObjects.Sprite = this.add.sprite(35, 205).play(PadAnimations.Up);

    [rightButton, leftButton, upButton].forEach((button) =>
      button
        .setScrollFactor(0, 0)
        .setDepth(100)
        .setAlpha(0.9)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => button.setTint(0xff4d4d))
        .on('pointerout', () => button.clearTint())
    );

    rightButton.on('pointerdown', () => (this.pad.right = true));
    rightButton.on('pointerup', () => (this.pad.right = false));

    leftButton.on('pointerdown', () => (this.pad.left = true));
    leftButton.on('pointerup', () => (this.pad.left = false));

    upButton.on('pointerdown', () => (this.pad.jump = true));
    upButton.on('pointerup', () => (this.pad.jump = false));
  }

  private createInputKeys() {
    this.keys = {
      jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      jump2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      fire: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      player: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
    };
  }

  private getInputKeys(): Partial<ActionState> {
    return {
      left: this.keys.left.isDown || this.pad.left,
      right: this.keys.right.isDown || this.pad.right,
      down: this.keys.down.isDown,
      jump: this.keys.jump.isDown || this.keys.jump2.isDown || this.pad.jump,
      fire: this.keys.fire.isDown,
      player: this.keys.player.justDown,
    };
  }

  private createBlocks() {
    this.blockEmitter = this.add.particles('mario-sprites');

    this.blockEmitter.createEmitter({
      frames: ['brick'],
      gravityY: 1000,
      lifespan: 2000,
      speed: 400,
      angle: { min: -90 - 25, max: -45 - 25 },
      frequency: -1,
    });

    this.bounceTile = new BounceBrick({ scene: this });
  }

  private createFireballs() {
    this.fireballs = this.add.group({
      classType: Fire,
      maxSize: 10,
      runChildUpdate: false, // Due to https://github.com/photonstorm/phaser/issues/3724
    });
  }

  private createHUD() {
    this.hud = this.add.bitmapText(5 * 8, 8, 'font', 'CALEB                              TIME', 8);
    this.hud.setScrollFactor(0, 0);

    this.levelTimer = {
      textObject: this.add.bitmapText(41 * 8, 16, 'font', '255', 8).setScrollFactor(0, 0),
      time: GameScene.GAME_TIMEOUT * 1000,
      displayedTime: 255,
      hurry: false,
    };

    this.score = {
      textObject: this.add.bitmapText(5 * 8, 16, 'font', '000000', 8).setScrollFactor(0, 0),
      pts: 0,
    };

    if (this.attractMode) {
      this.hud.alpha = 0;
      this.levelTimer.textObject.alpha = 0;
      this.score.textObject.alpha = 0;
    }
  }

  private createFinishLine() {
    let worldEndAt = -1;
    for (let x = 0; x < this.groundLayer.width; x++) {
      let tile = this.groundLayer.getTileAt(x, 2); // Finish line must be in tile y=2
      if (tile && tile.properties['worldsEnd']) {
        worldEndAt = tile.pixelX;
        break;
      }
    }

    this.finishLine = {
      flag: this.add.sprite(worldEndAt + 8, 4 * 16),
      x: worldEndAt,
      active: false,
    };
    this.finishLine.flag.play('flag');
  }

  private createPlayer() {
    this.mario = new Mario({
      scene: this,
      key: Players.Mario,
      x: 16 * 6,
      y: this.sys.game.config.height - 48 - 48, // TODO: Use level settings, or initial tile
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
    this.updateEnemies(time, delta);
    this.updatePowerUps();

    this.mario.update(time, delta, this.getInputKeys());
  }

  private updateAttractMode(delta: number) {
    if (!this.attractMode) {
      return;
    }

    this.attractMode.time += delta;

    if (
      this.mario.y > this.sys.game.config.height ||
      this.attractMode.recording.length <= this.attractMode.current + 2 ||
      this.attractMode.current === 14000
    ) {
      this.attractMode.current = 0;
      this.attractMode.time = 0;
      this.mario.x = 16 * 6;
      this.setRegistry(GameOptions.RestartScene, true);
      return;
    }

    if (this.attractMode.time >= this.attractMode.recording[this.attractMode.current + 1].time) {
      this.attractMode.current++;
      this.mario.x = this.attractMode.recording[this.attractMode.current].x;
      this.mario.y = this.attractMode.recording[this.attractMode.current].y;
      this.mario.body.setVelocity(
        this.attractMode.recording[this.attractMode.current].vx,
        this.attractMode.recording[this.attractMode.current].vy
      );
    }

    this.keys = {
      jump: <Key>{ isDown: this.attractMode.recording[this.attractMode.current].keys.jump },
      jump2: <Key>{ isDown: false },
      left: <Key>{ isDown: this.attractMode.recording[this.attractMode.current].keys.left },
      right: <Key>{ isDown: this.attractMode.recording[this.attractMode.current].keys.right },
      down: <Key>{ isDown: this.attractMode.recording[this.attractMode.current].keys.down },
      fire: <Key>{ isDown: this.attractMode.recording[this.attractMode.current].keys.fire },
      player: <Key>{ isDown: false },
    };
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

  private updateEnemies(time: number, delta: number) {
    Array.from(this.enemyGroup.children.entries).forEach((enemy: Enemy) => {
      enemy.update(time, delta);
    });
  }

  private updatePowerUps() {
    Array.from(this.powerUps.children.entries).forEach((powerUp: PowerUp) => {
      powerUp.update();
    });
  }

  private updateTimer(delta: number) {
    this.levelTimer.time -= delta * 2;

    if (this.levelTimer.time - this.levelTimer.displayedTime * 1000 < 1000) {
      this.levelTimer.displayedTime = Math.round(this.levelTimer.time / 1000);
      this.levelTimer.textObject.setText((<any>('' + this.levelTimer.displayedTime)).padStart(3, '0'));
      if (this.levelTimer.displayedTime < 50 && !this.levelTimer.hurry) {
        this.levelTimer.hurry = true;
        this.music.pause();
        let sound = this.sound.addAudioSprite('sfx');
        (<any>sound).on('ended', (sound) => {
          (<any>this.music).seek = 0;
          (<any>this.music).rate = 1.5;
          this.music.resume();
          sound.destroy();
        });
        (<any>sound).play('smb_warning');
      }
      if (this.levelTimer.displayedTime < 1) {
        this.mario.die();
        this.levelTimer.hurry = false;
        (<any>this.music).rate = 1;
        this.levelTimer.time = 150 * 1000;
        this.levelTimer.displayedTime = 255;
      }
    }
  }

  tileCollision(sprite: Mario | Turtle | Goomba, tile: TiledGameObject) {
    if (sprite instanceof Turtle) {
      // Turtles ignore the ground
      if (tile.y > Math.round(sprite.y / 16)) {
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
          tile.index = GameScene.METALLIC_BLOCK_TILE; // Shift to a metallic block
          this.bounceTile.restart(tile); // Bounce it a bit
          delete tile.properties.callback;
          tile.setCollision(true); // Invincible blocks are only collidable from above, but everywhere once revealed

          // Check powerUp for what to do, make a coin if not defined
          let powerUp = tile.powerUp ? tile.powerUp : PowerUps.Coin; // TODO: Refactor powerUp, split powerUps

          // Make powerUp (including a coin)
          const newPowerUp = new PowerUp({
            scene: this,
            key: 'sprites16',
            x: tile.x * 16 + 8,
            y: tile.y * 16 - 8,
            type: powerUp,
          });

          break;
        case TileCallbacks.Breakable:
          if (sprite instanceof Mario && sprite.playerState === '') {
            // Can't break it anyway. Bounce it a bit.
            this.bounceTile.restart(tile);
            this.sound.playAudioSprite('sfx', 'smb_bump');
          } else {
            // Get points
            this.updateScore(GameScene.COIN_SCORE);
            this.map.removeTileAt(tile.x, tile.y, true, true, <any>this.groundLayer);
            this.sound.playAudioSprite('sfx', 'smb_breakblock');
            this.blockEmitter.emitParticle(6, tile.x * 16, tile.y * 16);
          }
          break;
        case TileCallbacks.Toggle16Bit:
          this.eightBit = !this.eightBit;
          if (this.eightBit) {
            this.tileset.setImage(this.sys.textures.get('tiles'));
          } else {
            this.tileset.setImage(this.sys.textures.get('tiles-16bit'));
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

  updateScore(score: number) {
    this.score.pts += score;
    this.score.textObject.setText(('' + this.score.pts).padStart(6, '0'));
  }

  private removeFlag(step: number = 0) {
    // TODO: Use enum for steps
    switch (step) {
      case 0:
        this.music.pause();
        this.sound.playAudioSprite('sfx', 'smb_flagpole');
        this.mario.play('mario/climb' + this.mario.playerState); // TODO: Refactor
        this.mario.x = this.finishLine.x - 1;
        this.tweens.add({
          targets: this.finishLine.flag,
          y: 240 - 6 * 8,
          duration: 1500,
          onComplete: () => this.removeFlag(1),
        });
        this.tweens.add({
          targets: this.mario,
          y: 240 - 3 * 16,
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

        this.mario.play('run' + this.mario.playerState);

        this.mario.flipX = false;
        this.tweens.add({
          targets: this.mario,
          x: this.finishLine.x + 6 * 16,
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
