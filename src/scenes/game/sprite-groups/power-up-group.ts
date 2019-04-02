import { TILE_SIZE } from '@game/config';
import { PowerUps, TiledGameObject } from '@game/models';
import { PowerUp } from '@game/sprites';

import { GameScene } from '../scene';
import { World, WorldLayers } from './world';

export class PowerUpGroup {
  private readonly group: Phaser.GameObjects.Group;
  private readonly mapLayer: Phaser.Tilemaps.ObjectLayer;
  private readonly tileset: Phaser.Tilemaps.Tileset;

  constructor(private scene: GameScene, private world: World) {
    this.mapLayer = this.world.getLayer(WorldLayers.PowerUps);
    this.tileset = this.world.getTileset();
    this.group = this.scene.add.group();

    this.mapLayer.objects.forEach((powerUp: TiledGameObject) => {
      const tileProperties = this.scene.getTilesetProperties(powerUp, this.tileset);
      const tile: TiledGameObject = <any>this.world.getTileAt(powerUp.x / TILE_SIZE, powerUp.y / TILE_SIZE - 1);
      tile.properties.powerUp = <PowerUps>tileProperties.name;
    });
  }

  add(powerUp: PowerUp) {
    this.group.add(powerUp);
  }

  update() {
    Array.from(this.group.children.entries).forEach((powerUp: PowerUp) => {
      powerUp.update();
    });
  }

  remove(powerUp: PowerUp) {
    this.group.remove(powerUp);
  }
}
