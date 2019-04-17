import { Bear, Butterfly, Candy, Flower, PowerUp, Robot, TileCandy } from '@game/sprites';

export enum PowerUpTypes {
  TileCandy = 'tileCandy',
  Candy = 'candy',
  Bear = 'bear',
  Flower = 'flower',
  Robot = 'robot',
  Butterfly = 'butterfly',
}

export type PowerUps = Bear | Butterfly | Candy | TileCandy | Flower | Robot | PowerUp;
