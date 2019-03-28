export type Actions = 'jump' | 'jump2' | 'fire' | 'left' | 'right' | 'down' | 'player'; // TODO: Use enum
export type ActionKeys = { [key in Actions]: Phaser.Input.Keyboard.Key };
export type ActionState = { [key in Actions]: boolean };
