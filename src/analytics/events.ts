export enum GtmEventTypes {
  SignUp = 'SignUp',
  Login = 'Login',
  GameCompleted = 'GameCompleted',
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

// Game completed event

export interface GtmGameCompletedEvent {
  event: GtmEventTypes.GameCompleted;
  score: number;
}

// Methods

export type GtmEvent = GtmSignUpEvent | GtmLoginEvent | GtmGameCompletedEvent;

export type DataLayer = Readonly<GtmEvent[]>;

function dataLayer(): DataLayer {
  if (!(<any>window).dataLayer) {
    (<any>window).dataLayer = [];
  }
  return (<any>window).dataLayer;
}

export function pushEvent(event: GtmEvent) {
  dataLayer().push(event);
}
