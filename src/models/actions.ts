export enum Actions {
  Jump = 'jump',
  Jump2 = 'jump2',
  Fire = 'fire',
  Left = 'left',
  Right = 'right',
  Down = 'down',
  Player = 'player',
}

export type ActionKeys = { [key in Actions]: Phaser.Input.Keyboard.Key };
export type ActionState = { [key in Actions]: boolean };
