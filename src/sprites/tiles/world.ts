import { SUNSET_DURATION, TILE_SIZE } from '@game/config';
import {
  Checkpoint,
  Colors,
  Depths,
  PipeDirection as PipeDirections,
  PlayerStates,
  PowerUpTypes,
  Room,
  RoomSize,
  Scores,
  Sounds,
  TileCallbacks,
  TiledGameObject,
  Tilemap,
  TilemapIds,
  WorldLayers,
} from '@game/models';
import { GameScene } from '@game/scenes';
import { Car, createPowerUp, Player } from '@game/sprites';

const PIPE_PADDING = TILE_SIZE / 8;

export class World {
  private tilemap: Phaser.Tilemaps.Tilemap;
  private tileset: Phaser.Tilemaps.Tileset;
  private groundLayer: Phaser.Tilemaps.DynamicTilemapLayer;
  private sunset: Phaser.GameObjects.Graphics;
  private twilight: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Image;
  private city: Phaser.GameObjects.Image;
  private rooms: Room[] = [];
  private checkpoints: Checkpoint[] = [];

  constructor(private scene: GameScene) {
    this.initWorld();
  }

  init() {
    this.initSky();
    this.initCity();
  }

  private initWorld() {
    this.tilemap = this.scene.make.tilemap({ key: Tilemap.MapKey });

    this.tileset = this.tilemap.addTilesetImage(Tilemap.TilesetName, Tilemap.TilesetKey);
    this.groundLayer = this.tilemap.createDynamicLayer(Tilemap.WorldLayerKey, this.tileset, 0, 0);

    this.scene.physics.world.bounds.width = this.groundLayer.width;
    this.groundLayer.setCollisionByProperty({ collide: true });
  }

  private initSky() {
    const { height, width } = this.scene.getGameDimensions();

    // Create the sky background color
    this.sunset = this.scene.add
      .graphics({ x: 0, y: 0 })
      .setDepth(Depths.Twilight)
      .setScrollFactor(0, 0)
      .setAlpha(0)
      .setActive(false)
      .fillGradientStyle(Colors.SkyBlue, Colors.SkyBlue, Colors.SkyYellow, Colors.SkyYellow)
      .fillRect(0, 0, width, height);

    this.twilight = this.scene.add
      .graphics({ x: 0, y: 0 })
      .setDepth(Depths.Twilight)
      .setScrollFactor(0, 0)
      .setAlpha(0)
      .setActive(false)
      .fillGradientStyle(Colors.Blue, Colors.Blue, Colors.Orange, Colors.Orange)
      .fillRect(0, 0, width, height);

    // Create the clouds
    this.clouds = this.scene.add.image(0, 0, Tilemap.SkyKey).setDepth(Depths.Clouds);
    this.setBackgroundSprite(this.clouds);

    if (this.scene.demo.isActive()) {
      this.clouds.setAlpha(0);
    } else {
      this.scene.tweens.add({ targets: this.sunset, alpha: 0.7, delay: SUNSET_DURATION, duration: SUNSET_DURATION });
      this.scene.tweens.add({ targets: this.twilight, alpha: 1, delay: SUNSET_DURATION * 2, duration: SUNSET_DURATION });
    }
  }

  private initCity() {
    this.city = this.scene.add
      .image(0, 0, Tilemap.CityKey)
      .setDepth(Depths.City)
      .setAlpha(0.7);
    this.setBackgroundSprite(this.city);
  }

  private setBackgroundSprite(sprite: Phaser.GameObjects.Image) {
    const worldWidth = this.size().width;
    const { width } = this.scene.getGameDimensions();

    const scrollFactorX: number = (sprite.width - width) / (worldWidth - width);
    sprite
      .setActive(false)
      .setScrollFactor(scrollFactorX, 0)
      .setPosition(sprite.width / 2, sprite.height / 2);
  }

  update() {
    if (this.checkpoints.length < 2) {
      return;
    }

    const nextCheckpoint: Checkpoint = this.checkpoints[1];

    if (this.scene.player.body.x > nextCheckpoint.x) {
      this.checkpoints.shift(); // Remove checkpoint since a new one has been completed
    }
  }

  // Methods for tileset

  size(): RoomSize {
    const firstRoom: Room = this.rooms[0];

    return {
      width: firstRoom.width,
      height: firstRoom.height,
    };
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

  // Methods for modifiers

  addRoom(room: Room) {
    this.rooms.push(room);
    this.rooms = this.rooms.sort((roomtA, roomB) => (roomtA.x > roomB.x ? 1 : -1));
  }

  setRoomBounds() {
    this.rooms.forEach((room) => {
      if (this.scene.player.x >= room.x && this.scene.player.x <= room.x + room.width) {
        const camera: Phaser.Cameras.Scene2D.Camera = this.scene.cameras.main;
        const { height, scaleX, scaleY } = this.groundLayer;
        camera.setBounds(room.x, 0, room.width * scaleX, height * scaleY);
        this.scene.finishLine.setActive(room.x === 0);
        this.scene.cameras.main.setBackgroundColor(room.backgroundColor);
      }
    });
  }

  addCheckpoint(checkpoint: Checkpoint) {
    this.checkpoints.push(checkpoint);
    this.checkpoints = this.checkpoints.sort((checkpointA, checkpointB) => (checkpointA.x > checkpointB.x ? 1 : -1));
  }

  getCurrentCheckpoint(): Checkpoint {
    return this.checkpoints[0];
  }

  // Collision handling

  collide(sprite: Phaser.GameObjects.Sprite, collideCallback?: ArcadePhysicsCallback) {
    this.scene.physics.world.collide(sprite, this.groundLayer, collideCallback);
  }

  tileCollision(sprite: Phaser.GameObjects.Sprite, tile: TiledGameObject) {
    if (sprite instanceof Car) {
      // Cars ignore the ground
      if (tile.y > Math.round(sprite.y / TILE_SIZE)) {
        return;
      }
    } else if (sprite instanceof Player) {
      // Player is bending on a pipe that leads somewhere:
      if (sprite.isBending() && !!tile.properties.pipe && !!tile.properties.goto) {
        let fitsPipe: boolean;
        const { x, y, width, height } = tile.properties;

        // Make sure player fits within the pipe
        switch (tile.properties.direction) {
          case PipeDirections.Down:
          case PipeDirections.Up:
            fitsPipe = x < sprite.x - sprite.body.width / 2 - PIPE_PADDING && x + width > sprite.x + sprite.body.width / 2 + PIPE_PADDING;
            break;
          case PipeDirections.Right:
          case PipeDirections.Left:
            fitsPipe = y < sprite.y - sprite.body.height / 2 - PIPE_PADDING;
            break;
          default:
            fitsPipe = true;
        }

        if (fitsPipe) {
          sprite.enterPipe(tile.properties.goto, tile.properties.direction, x + width / 2, y + height / 2);
        }
      }

      // If it's player and the body isn't blocked up it can't hit question marks or break bricks
      // Otherwise player will break bricks he touch from the side while moving up.
      if (!sprite.body.blocked.up) {
        return;
      }
    }

    // If the tile has a callback, lets call it
    if (tile.properties.callback) {
      switch (tile.properties.callback) {
        case TileCallbacks.QuestionMark:
          tile.index = TilemapIds.BlockTile + 1; // Shift to a metallic block
          this.scene.bounceBrick.restart(tile); // Bounce it a bit
          delete tile.properties.callback;
          tile.setCollision(true); // Invincible blocks are only collidable from above, but everywhere once revealed

          // Check powerUp for what to do, make a candy if not defined
          const powerUpType: PowerUpTypes = tile.properties.powerUp ? tile.properties.powerUp : PowerUpTypes.TileCandy;

          // Make powerUp (including a candy)
          createPowerUp(this.scene, tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE - TILE_SIZE / 2, powerUpType);

          break;
        case TileCallbacks.Breakable:
          if (sprite instanceof Player && sprite.playerState === PlayerStates.Default) {
            // Can't break it anyway. Bounce it a bit.
            this.scene.bounceBrick.restart(tile);
            this.scene.soundEffects.playEffect(Sounds.Bump);
          } else {
            // Get points
            this.scene.hud.updateScore(Scores.Brick, tile.x * TILE_SIZE, tile.y * TILE_SIZE);
            this.removeTileAt(tile.x, tile.y);
            this.scene.soundEffects.playEffect(Sounds.BreakBlock);
            this.scene.blockEmitter.emit(tile.x * TILE_SIZE, tile.y * TILE_SIZE);
          }
          break;
        default:
          this.scene.soundEffects.playEffect(Sounds.Bump);
          break;
      }
    } else if (sprite instanceof Player) {
      this.scene.soundEffects.playEffect(Sounds.Bump);
    }
  }
}
