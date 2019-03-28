import { PowerUps } from './power-up';

export interface TiledGameObject extends Phaser.GameObjects.GameObject {
  gid?: number;
  index?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: TileProperties;
  powerUp?: PowerUps; // TODO: Remove
  setCollision: (recalculateFaces?: boolean) => Phaser.Tilemaps.Tile;
}

export enum TileCallbacks {
  QuestionMark = 'questionMark',
  Breakable = 'breakable',
}

export type TileProperties = {
  callback?: TileCallbacks;
  // TODO: Type other properties
  [key: string]: any;
};
