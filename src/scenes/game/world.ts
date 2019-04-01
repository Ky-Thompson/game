import { SKY_HEIGHT, Tilemap } from '../../models';
import { GameScene } from './game-scene';

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

export class World {
  private tilemap: Phaser.Tilemaps.Tilemap;
  private tileset: Phaser.Tilemaps.Tileset;
  private backgroundLayer: Phaser.Tilemaps.StaticTilemapLayer;
  private groundLayer: Phaser.Tilemaps.DynamicTilemapLayer;

  constructor(private scene: GameScene) {
    this.init();
  }

  private init() {
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

  collide(sprite: Phaser.GameObjects.Sprite, collideCallback?: ArcadePhysicsCallback) {
    this.scene.physics.world.collide(sprite, this.groundLayer, collideCallback);
  }
}
