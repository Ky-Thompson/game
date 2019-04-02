import { TILE_SIZE } from '../../../config';
import { TiledGameObject } from '../../../models';
import { PowerUp } from '../../../sprites';
import { GameScene } from '../scene';
import { World, WorldLayers } from '../sprite-groups';

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
      // TODO: Use enums for 'powerUp', 'callback', 'questionMark'
      const tile: Phaser.Tilemaps.Tile = this.world.getTileAt(powerUp.x / TILE_SIZE, powerUp.y / TILE_SIZE - 1);
      tile.properties['powerUp'] = tileProperties.name;
    });
  }

  add(powerUp: PowerUp) {
    this.group.add(powerUp);
  }

  update(time: number, delta: number) {
    Array.from(this.group.children.entries).forEach((powerUp: PowerUp) => {
      powerUp.update();
    });
  }

  remove(powerUp: PowerUp) {
    this.group.remove(powerUp);
  }
}
