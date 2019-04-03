import { GameOptions, TiledGameObject, TileProperties } from '@game/models';

export interface GameConfig extends Phaser.Core.Config {
  height: number;
  width: number;
}

export abstract class BaseScene extends Phaser.Scene {
  constructor(config: Phaser.Scenes.Settings.Config) {
    super(config);
  }

  /**
   * Game properties
   */

  gameConfig(): GameConfig {
    return <any>this.sys.game.config;
  }

  /**
   * Registry for global settings
   */

  getRegistry(option: GameOptions) {
    return this.registry.get(String(option));
  }

  setRegistry(option: GameOptions, value: any) {
    return this.registry.set(String(option), value);
  }

  /**
   * Helpers to handle Tiled tiles
   */

  getTilesetProperties(tile: TiledGameObject, tileset: Phaser.Tilemaps.Tileset): TileProperties {
    return tileset.tileProperties[tile.gid - 1] as TileProperties;
  }
}
