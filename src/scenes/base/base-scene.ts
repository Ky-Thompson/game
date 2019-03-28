import { GameOptions, TiledGameObject, TileProperties } from '../../models';

export abstract class BaseScene extends Phaser.Scene {
  constructor(config: Phaser.Scenes.Settings.Config) {
    super(config);
  }

  // Game properties

  gameConfig(): Phaser.Boot.Config {
    return this.sys.game.config;
  }

  // Registry for global settings

  getRegistry(option: GameOptions) {
    return this.registry.get(String(option));
  }

  setRegistry(option: GameOptions, value: any) {
    return this.registry.set(String(option), value);
  }

  // Helpers to handle Tiled tiles

  getTilesetProperties(tile: TiledGameObject, tileset: Phaser.Tilemaps.Tileset): TileProperties {
    return tileset.tileProperties[tile.gid - 1];
  }

  consolidateProperties(tile: TiledGameObject) {
    if (Array.isArray(tile.properties)) {
      const properties = {};
      tile.properties.forEach((prop) => {
        properties[prop.name] = prop.value;
      });
      tile.properties = properties;
    }
  }
}
