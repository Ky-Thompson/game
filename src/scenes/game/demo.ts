import { Actions, ActionState, GameOptions, TiledGameObject, WorldLayers } from '@game/models';

import { GameScene } from './game-scene';

const MAX_DEMO_MODE_TIME = 14000;
const PLAYER_BLOCKED_TIME = 100;
const PLAYER_MIN_VELOCITY_X = 40;

interface DemoAction {
  x: number;
  action: Actions;
  time: number;
  added?: boolean;
  timeout?: number;
}

export class Demo {
  private readonly mapLayer: Phaser.Tilemaps.ObjectLayer;
  private demoActions: DemoAction[] = [];
  private currentActions: DemoAction[] = [];
  private time: number = 0;
  private blockedTime: number = 0;
  private active: boolean = false;

  constructor(private scene: GameScene) {
    this.mapLayer = this.scene.world.getLayer(WorldLayers.Demo);

    this.demoActions = this.mapLayer.objects
      .map(
        (demoAction: TiledGameObject): DemoAction => {
          this.scene.consolidateProperties(demoAction);
          return {
            x: demoAction.x,
            action: demoAction.properties.action,
            time: demoAction.properties.time,
          };
        }
      )
      .filter(({ x, action, time }) => x > 0 && action && time > 0)
      .sort((actionA, actionB) => (actionA.x > actionB.x ? 1 : -1));

    if (this.scene.getRegistry(GameOptions.Demo)) {
      this.active = true;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  reset() {
    this.time = 0;
  }

  update(delta: number) {
    if (!this.active || !this.scene.player) {
      return;
    }

    this.time += delta;

    // Check player alive
    const { height } = this.scene.getGameDimensions();
    if (this.scene.player.y > height || this.hasEnded()) {
      this.reset();
      this.scene.player.x = this.scene.start.x;
      this.scene.setRegistry(GameOptions.RestartScene, true);
      return;
    }

    // Remove past actions
    this.currentActions = this.currentActions.filter((demoAction) => demoAction.timeout && demoAction.timeout >= this.time);

    // Add new actions
    this.demoActions
      .filter((demoAction) => !demoAction.added && demoAction.x <= this.scene.player.x)
      .forEach((demoAction) => this.addAction(demoAction));
    this.demoActions = this.demoActions.filter((demoAction) => !demoAction.added);

    // Check player blocked right, if so jump
    if (!this.currentActions.length && Math.abs(this.scene.player.body.velocity.x) <= PLAYER_MIN_VELOCITY_X) {
      this.blockedTime += delta;

      if (this.blockedTime > PLAYER_BLOCKED_TIME) {
        this.addAction({ action: Actions.Jump, time: 400, x: 0 });
        this.blockedTime = 0;
      }
    } else {
      this.blockedTime = 0;
    }
  }

  private addAction(demoAction: DemoAction) {
    demoAction.added = true;
    demoAction.timeout = this.time + demoAction.time;
    this.currentActions.push(demoAction);
  }

  getActions(): Partial<ActionState> {
    let actions: Partial<ActionState> = { right: true };

    if (this.scene.player)
      this.currentActions.forEach((demoAction) => {
        actions[demoAction.action] = true;
      });

    if (actions.left || actions.stop) {
      actions.right = false;
    }

    if (actions.stop) {
      actions.left = false;
    }

    return actions;
  }

  hasEnded(): boolean {
    return this.time >= MAX_DEMO_MODE_TIME;
  }
}
