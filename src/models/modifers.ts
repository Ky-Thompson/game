export enum Modifiers {
  Pipe = 'pipe',
  Destination = 'dest',
  Room = 'room',
  Start = 'start',
  End = 'end',
  FinishLine = 'finishLine',
  Checkpoint = 'checkpoint',
  Image = 'image',
}

export interface RoomSize {
  width: number;
  height: number;
}

export interface Room {
  x: number;
  width: number;
  height: number;
  backgroundColor: string;
}

export interface Checkpoint {
  x: number;
  y: number;
}
