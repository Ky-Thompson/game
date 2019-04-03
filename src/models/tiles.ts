import { Modifiers } from './modifers';
import { PipeDirection } from './pipes';
import { PowerUps } from './power-up';

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
  name?: string;
  type?: Modifiers;
  backgroundColor?: string;
  powerUp?: PowerUps;
  pipe?: boolean;
  pipeId?: number;
  goto?: number;
  direction?: PipeDirection;
  callback?: TileCallbacks;
};

export enum Tilemap {
  MapKey = 'map',
  TilesetName = 'tileset',
  TilesetKey = 'tiles',
  BackgroundLayerKey = 'background',
  WorldLayerKey = 'world',
  SkyKey = 'background-clouds',
}

export enum TilemapIds {
  BlockTile = 44,
}

export const SKY_HEIGHT = 1000;
