export enum GtmEventTypes {
  SignUp = 'SignUp',
  Login = 'Login',
  GameCompleted = 'GameCompleted',
  GameStart = 'GameStart',
  GameTimeout = 'GameTimeout',
  GameOver = 'GameOver',
  HiddenRoom = 'HiddenRoom',
}

// Sign-up event

export interface GtmSignUpEvent {
  event: GtmEventTypes.SignUp;
}

// Login event

export enum GtmLoginTypes {
  Google,
  Email,
  Link,
}

export interface GtmLoginEvent {
  event: GtmEventTypes.Login;
  login: GtmLoginTypes;
}

// Game events
export interface GtmGameStartEvent {
  event: GtmEventTypes.GameStart;
}

export interface GtmGameTimeoutEvent {
  event: GtmEventTypes.GameTimeout;
}

export interface GtmGameGameOverEvent {
  event: GtmEventTypes.GameOver;
}

export interface GtmGameCompletedEvent {
  event: GtmEventTypes.GameCompleted;
  score: number;
}

// Hidden room

export interface GtmEnterPipeEvent {
  event: GtmEventTypes.HiddenRoom;
}

// Methods

export type GtmEvent =
  | GtmSignUpEvent
  | GtmLoginEvent
  | GtmGameStartEvent
  | GtmGameTimeoutEvent
  | GtmGameGameOverEvent
  | GtmGameCompletedEvent
  | GtmEnterPipeEvent;

export type DataLayer = GtmEvent[];

function dataLayer(): DataLayer {
  if (!(<any>window).dataLayer) {
    (<any>window).dataLayer = [];
  }
  return (<any>window).dataLayer;
}

export function pushEvent(event: GtmEvent) {
  dataLayer().push(event);
}
