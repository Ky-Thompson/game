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
  name?: string; // TODO: Type
  type?: Modifiers;
  backgroundColor?: string;
  powerUp?: PowerUpTypes;
  pipe?: boolean;
  pipeId?: number;
  goto?: number;
  direction?: PipeDirection;
  callback?: TileCallbacks;
  image?: string;
};

export enum Tilemap {
  MapKey = 'map',
  TilesetName = 'tileset',
  TilesetKey = 'tiles',
  WorldLayerKey = 'world',
  SkyKey = 'background-clouds',
  CityKey = 'city',
}

export enum TilemapIds {
  BrickTile = 11,
  BlockTile = 14,
}

export const SKY_HEIGHT = 1000;
