export enum PipeDirection {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export type PipeDestinations = { [id: number]: PipeDestination };

export type PipeDestination = {
  x: number;
  y: number;
  top: boolean;
  direction: PipeDirection;
};
