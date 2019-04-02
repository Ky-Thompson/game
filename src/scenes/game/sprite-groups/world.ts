import { TILE_SIZE } from '../../../config';
import { PlayerStates, PowerUps, SKY_HEIGHT, TileCallbacks, TiledGameObject, Tilemap } from '../../../models';
import { Player, PowerUp, Turtle } from '../../../sprites';
import { COIN_SCORE, METALLIC_BLOCK_TILE } from '../constants';
import { GameScene } from '../scene';

export enum WorldLayers {
  Enemies = 'enemies',
  PowerUps = 'power-ups',
  Modifiers = 'modifiers',
}

export interface WorldSize {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

export interface Room {
  x: number;
  width: number;
  sky: string; // TODO: Rename to background
}

export class World {
  private readonly tilemap: Phaser.Tilemaps.Tilemap;
  private readonly tileset: Phaser.Tilemaps.Tileset;
  private readonly backgroundLayer: Phaser.Tilemaps.StaticTilemapLayer;
  private readonly groundLayer: Phaser.Tilemaps.DynamicTilemapLayer;
  private readonly rooms: Room[] = [];

  constructor(private scene: GameScene) {
    this.tilemap = this.scene.make.tilemap({ key: Tilemap.MapKey });
    (<any>this.scene.sys).animatedTiles.init(this.tilemap); // TODO: Make animated tiles work or remove

    this.tileset = this.tilemap.addTilesetImage(Tilemap.TilesetName, Tilemap.TilesetKey);
    this.backgroundLayer = this.tilemap.createStaticLayer(Tilemap.BackgroundLayerKey, this.tileset, 0, 0);
    this.groundLayer = this.tilemap.createDynamicLayer(Tilemap.WorldLayerKey, this.tileset, 0, 0);
    this.scene.add.tileSprite(0, 0, this.backgroundLayer.width, SKY_HEIGHT, Tilemap.SkyKey).setDepth(-1); // Fix background color

    this.scene.physics.world.bounds.width = this.groundLayer.width;
    this.groundLayer.setCollisionByExclusion([-1], true);
  }

  getLayer(name: WorldLayers): Phaser.Tilemaps.ObjectLayer {
    return this.tilemap.getObjectLayer(name);
  }

  getTileset(): Phaser.Tilemaps.Tileset {
    return this.tileset;
  }

  getTileAt(x: number, y: number): Phaser.Tilemaps.Tile {
    // TODO: Abstract conversion
    return this.groundLayer.getTileAt(x, y);
  }

  removeTileAt(x: number, y: number) {
    this.tilemap.removeTileAt(x, y, true, true, <any>this.groundLayer); // TODO: Check type
  }

  size(): WorldSize {
    return {
      width: this.groundLayer.width,
      height: this.groundLayer.height,
      scaleX: this.groundLayer.scaleX,
      scaleY: this.groundLayer.scaleY,
    };
  }

  addRoom(room: Room) {
    this.rooms.push(room);
  }

  setRoomBounds() {
    this.rooms.forEach((room) => {
      if (this.scene.player.x >= room.x && this.scene.player.x <= room.x + room.width) {
        const camera: Phaser.Cameras.Scene2D.Camera = this.scene.cameras.main;
        const { height, scaleX, scaleY } = this.scene.world.size();
        camera.setBounds(room.x, 0, room.width * scaleX, height * scaleY);
        this.scene.finishLine.setActive(room.x === 0);
        this.scene.cameras.main.setBackgroundColor(room.sky);
      }
    });
  }

  collide(sprite: Phaser.GameObjects.Sprite, collideCallback?: ArcadePhysicsCallback) {
    this.scene.physics.world.collide(sprite, this.groundLayer, collideCallback);
  }

  tileCollision(sprite: Phaser.GameObjects.Sprite, tile: TiledGameObject) {
    if (sprite instanceof Turtle) {
      // Turtles ignore the ground
      if (tile.y > Math.round(sprite.y / TILE_SIZE)) {
        return;
      }
    } else if (sprite instanceof Player) {
      // Mario is bending on a pipe that leads somewhere:
      if (sprite.isBending() && tile.properties.pipe && tile.properties.dest) {
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
          this.scene.bounceBrick.restart(tile); // Bounce it a bit
          delete tile.properties.callback;
          tile.setCollision(true); // Invincible blocks are only collidable from above, but everywhere once revealed

          // Check powerUp for what to do, make a coin if not defined
          const powerUpType: PowerUps = tile.properties.powerUp ? tile.properties.powerUp : PowerUps.Coin;

          // Make powerUp (including a coin)
          const newPowerUp = new PowerUp(this.scene, tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE - TILE_SIZE / 2, powerUpType);

          if (powerUpType === PowerUps.Coin) {
            this.scene.hud.updateScore(COIN_SCORE);
          }

          break;
        case TileCallbacks.Breakable:
          if (sprite instanceof Player && sprite.isPlayerState(PlayerStates.Default)) {
            // Can't break it anyway. Bounce it a bit.
            this.scene.bounceBrick.restart(tile);
            this.scene.sound.playAudioSprite('sfx', 'smb_bump');
          } else {
            // Get points
            this.scene.hud.updateScore(COIN_SCORE); // TODO: Move COIN_SCORE somewhere
            this.removeTileAt(tile.x, tile.y);
            this.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
            this.scene.blockEmitter.emit(tile.x * TILE_SIZE, tile.y * TILE_SIZE);
          }
          break;
        default:
          this.scene.sound.playAudioSprite('sfx', 'smb_bump');
          break;
      }
    } else {
      this.scene.sound.playAudioSprite('sfx', 'smb_bump');
    }
  }
}
