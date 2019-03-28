import { ActionState, GameOptions } from '../../models';
import { GameScene } from './game-scene';

const MAX_ATTRACT_MODE_TIME = 14000;

// TODO: Move to models
export interface AttractModeFrame {
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  keys: ActionState; // TODO: Use keys instead of actions
}

export class AttractMode {
  private recording: AttractModeFrame[];
  private current: number = 0;
  private time: number = 0;
  private active: boolean = false;

  constructor(private scene: GameScene) {
    this.init();
  }

  private init() {
    if (this.scene.getRegistry(GameOptions.AttractMode)) {
      this.recording = this.scene.sys.cache.json.entries.entries.attractMode;
      this.active = true;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  reset() {
    this.current = 0;
    this.time = 0;
  }

  update(delta: number) {
    this.time += delta;
  }

  hasEnded(): boolean {
    return this.recording.length <= this.current + 2 || this.current >= MAX_ATTRACT_MODE_TIME;
  }

  isNewFrame(): boolean {
    return this.time >= this.recording[this.current + 1].time;
  }

  goNextFrame() {
    this.current++;
  }

  getCurrentFrame(): AttractModeFrame {
    return this.recording[this.current];
  }
}
