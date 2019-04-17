import { TILE_SIZE } from '@game/config';
import { PowerUps, PowerUpTypes, TiledGameObject } from '@game/models';
import { createPowerUp } from '@game/sprites';

import { GameScene } from '../scene';
import { World, WorldLayers } from './world';

export class PowerUpsGroup {
  private readonly group: Phaser.GameObjects.Group;
  private readonly mapLayer: Phaser.Tilemaps.ObjectLayer;
  private readonly tileset: Phaser.Tilemaps.Tileset;

  constructor(private scene: GameScene, private world: World) {
    this.mapLayer = this.world.getLayer(WorldLayers.PowerUps);
    this.tileset = this.world.getTileset();
    this.group = this.scene.add.group();

    this.mapLayer.objects.forEach((powerUp: TiledGameObject) => {
      const tileProperties = this.scene.getTilesetProperties(powerUp, this.tileset);

      switch (tileProperties.name) {
        case PowerUpTypes.Candy:
          this.add(createPowerUp(this.scene, powerUp.x + TILE_SIZE / 2, powerUp.y - TILE_SIZE / 2, PowerUpTypes.Candy));
          break;
        default:
          // Other power-ups are just linked to the underlying question mark
          const tile: Phaser.Tilemaps.Tile = this.world.getTileAt(powerUp.x / TILE_SIZE, powerUp.y / TILE_SIZE - 1);
          tile.properties['powerUp'] = <PowerUpTypes>tileProperties.name;
      }
    });
  }

  add(powerUp: PowerUps) {
    this.group.add(powerUp);
  }

  update() {
    Array.from(this.group.children.entries).forEach((powerUp: PowerUps) => {
      powerUp.update();
    });
  }

  remove(powerUp: PowerUps) {
    this.group.remove(powerUp);
  }
}
