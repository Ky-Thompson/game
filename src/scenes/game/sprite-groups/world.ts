import { SUNSET_DURATION, TILE_SIZE } from '@game/config';
import { Colors, Depth, PlayerStates, PowerUps, Scores, Sounds, TileCallbacks, TiledGameObject, Tilemap, TilemapIds } from '@game/models';
import { Player, PowerUp, Turtle } from '@game/sprites';

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
  backgroundColor: string;
}

export class World {
  private tilemap: Phaser.Tilemaps.Tilemap;
  private tileset: Phaser.Tilemaps.Tileset;
  private groundLayer: Phaser.Tilemaps.DynamicTilemapLayer;
  private sunset: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Sprite;
  private readonly rooms: Room[] = [];

  constructor(private scene: GameScene) {
    this.createWorld();
    this.createSky();
  }

  private createWorld() {
    this.tilemap = this.scene.make.tilemap({ key: Tilemap.MapKey });

    this.tileset = this.tilemap.addTilesetImage(Tilemap.TilesetName, Tilemap.TilesetKey);
    this.groundLayer = this.tilemap.createDynamicLayer(Tilemap.WorldLayerKey, this.tileset, 0, 0);

    this.scene.physics.world.bounds.width = this.groundLayer.width;
    this.groundLayer.setCollisionByProperty({ collide: true });
  }

  private createSky() {
    const { height, width } = this.scene.gameConfig();

    // Create the sky background color
    this.sunset = this.scene.add
      .graphics({ x: 0, y: 0 })
      .setDepth(Depth.Sunset)
      .setScrollFactor(0, 0)
      .setAlpha(0);
    this.sunset.fillGradientStyle(Colors.Blue, Colors.Blue, Colors.Orange, Colors.Orange);
    this.sunset.fillRect(0, 0, width, height);

    // Create the clouds
    this.clouds = this.scene.add.sprite(0, 0, Tilemap.SkyKey).setDepth(Depth.Clouds);
    this.clouds.setPosition(this.clouds.width / 2, this.clouds.height / 2);
    const scrollFactorX: number = this.clouds.width / this.groundLayer.width;
    this.clouds.setScrollFactor(scrollFactorX, 0);

    if (this.scene.attractMode.isActive()) {
      this.clouds.setAlpha(0);
    } else {
      this.scene.tweens.add({ targets: this.sunset, alpha: 0.9, delay: SUNSET_DURATION, duration: SUNSET_DURATION });
    }
  }

  getLayer(name: WorldLayers): Phaser.Tilemaps.ObjectLayer {
    return this.tilemap.getObjectLayer(name);
  }

  getTileset(): Phaser.Tilemaps.Tileset {
    return this.tileset;
  }

  getTileAt(x: number, y: number): Phaser.Tilemaps.Tile {
    return this.groundLayer.getTileAt(x, y);
  }

  removeTileAt(x: number, y: number) {
    this.tilemap.removeTileAt(x, y, true, true, this.groundLayer);
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
        this.scene.cameras.main.setBackgroundColor(room.backgroundColor);
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
      // Player is bending on a pipe that leads somewhere:
      if (sprite.isBending() && tile.properties.pipe && tile.properties.goto) {
        sprite.enterPipe(tile.properties.goto, tile.properties.direction);
      }

      // If it's player and the body isn't blocked up it can't hit question marks or break bricks
      // Otherwise player will break bricks he touch from the side while moving up.
      if (!sprite.body.blocked.up) {
        return;
      }
    }

    // If the tile has a callback, lets fire it
    if (tile.properties.callback) {
      switch (tile.properties.callback) {
        case TileCallbacks.QuestionMark:
          tile.index = TilemapIds.BlockTile + 1; // Shift to a metallic block TODO: Avoid using +1
          this.scene.bounceBrick.restart(tile); // Bounce it a bit
          delete tile.properties.callback;
          tile.setCollision(true); // Invincible blocks are only collidable from above, but everywhere once revealed

          // Check powerUp for what to do, make a candy if not defined
          const powerUpType: PowerUps = tile.properties.powerUp ? tile.properties.powerUp : PowerUps.Candy;

          // Make powerUp (including a candy)
          const newPowerUp = new PowerUp(this.scene, tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE - TILE_SIZE / 2, powerUpType);

          if (powerUpType === PowerUps.Candy) {
            this.scene.hud.updateScore(Scores.Candy);
          }

          break;
        case TileCallbacks.Breakable:
          if (sprite instanceof Player && sprite.isPlayerState(PlayerStates.Default)) {
            // Can't break it anyway. Bounce it a bit.
            this.scene.bounceBrick.restart(tile);
            this.scene.soundEffects.playEffect(Sounds.Bump);
          } else {
            // Get points
            this.scene.hud.updateScore(Scores.Brick);
            this.removeTileAt(tile.x, tile.y);
            this.scene.soundEffects.playEffect(Sounds.BreakBlock);
            this.scene.blockEmitter.emit(tile.x * TILE_SIZE, tile.y * TILE_SIZE);
          }
          break;
        default:
          this.scene.soundEffects.playEffect(Sounds.Bump);
          break;
      }
    } else {
      this.scene.soundEffects.playEffect(Sounds.Bump);
    }
  }
}
