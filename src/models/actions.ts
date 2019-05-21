export enum Actions {
  Jump = 'jump',
  Jump2 = 'jump2',
  ThrowBible = 'throwBible',
  Left = 'left',
  Right = 'right',
  Down = 'down',
  Stop = 'stop',
}

export type ActionKeys = { [key in Actions]: Phaser.Input.Keyboard.Key };
export type ActionState = { [key in Actions]: boolean };
