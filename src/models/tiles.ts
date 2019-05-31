import { Actions } from './actions';
import { EnemyTypes } from './enemies';
import { Modifiers } from './modifers';
import { PipeDirection } from './pipes';
import { PowerUpTypes } from './power-up';

export interface TiledGameObject extends Phaser.GameObjects.Sprite {
  gid?: number;
  id?: number;
  index?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: TileProperties;
  setCollision: (recalculateFaces?: boolean) => Phaser.Tilemaps.Tile;
}

export enum TileCallbacks {
  QuestionMark = 'questionMark',
  Breakable = 'breakable',
}

export type TileProperties = {
  name?: EnemyTypes | PowerUpTypes;
  type?: Modifiers;
  backgroundColor?: string;
  powerUp?: PowerUpTypes;
  pipe?: boolean;
  pipeId?: number;
  goto?: number;
  direction?: PipeDirection;
  callback?: TileCallbacks;
  image?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  action?: Actions;
  time?: number;
  attract?: boolean;
};

export enum Tilemap {
  MapKey = 'map',
  TilesetName = 'tileset',
  TilesetKey = 'tiles',
  WorldLayerKey = 'world',
  SkyKey = 'background-clouds',
  CityKey = 'city',
  CityLightsKey = 'city-lights',
}

export enum TilemapIds {
  BrickTile = 11,
  BlockTile = 14,
}

export enum WorldLayers {
  Enemies = 'enemies',
  PowerUps = 'power-ups',
  Modifiers = 'modifiers',
  Demo = 'demo',
}

export const SKY_HEIGHT = 1000;
