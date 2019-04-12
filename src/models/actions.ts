export enum Actions {
  Jump = 'jump',
  Jump2 = 'jump2',
  ThrowBible = 'throwBible',
  Left = 'left',
  Right = 'right',
  Down = 'down',
}

export type ActionKeys = { [key in Actions]: Phaser.Input.Keyboard.Key };
export type ActionState = { [key in Actions]: boolean };
