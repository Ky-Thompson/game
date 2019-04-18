import { Car, Enemy, Liar } from '@game/sprites';

export enum EnemyTypes {
  Liar = 'liar',
  Car = 'car',
}

export type Enemies = Liar | Car | Enemy;
