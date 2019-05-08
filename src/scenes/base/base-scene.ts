import { ActionState, Dimensions, GameOptions, TiledGameObject, TileProperties } from '@game/models';

export enum GamepadButtons {
  A = 1,
  B = 2,
  Y = 3,
  X = 0,
  Select = 8,
  Start = 9,
  L = 4,
  R = 6,
  Right = -1,
  Left = -2,
  Up = -3,
  Down = -4,
}

export type GamepadState = Partial<{ [key in GamepadButtons]: boolean }>;

export const GAMEPAD_AXIS_THRESHOLD = 0.3;

export abstract class BaseScene extends Phaser.Scene {
  private gamepad: Phaser.Input.Gamepad.Gamepad;
  private prevAxis: GamepadState = {
    [GamepadButtons.Right]: false,
    [GamepadButtons.Left]: false,
    [GamepadButtons.Up]: false,
    [GamepadButtons.Down]: false,
  };

  constructor(config: Phaser.Scenes.Settings.Config) {
    super(config);
  }

  init() {
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => {
      (<any>this.sound).context.resume();
    });
  }

  // Game properties

  getGameDimensions(): Dimensions {
    return <any>this.sys.game.config;
  }

  isMobile(): boolean {
    const isAndroid: boolean = !!navigator.userAgent.match(/Android/i);
    const isIOS: boolean = !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
    return isAndroid || isIOS;
  }

  // Registry for global settings

  getRegistry(option: GameOptions) {
    return this.registry.get(String(option));
  }

  setRegistry(option: GameOptions, value: any) {
    return this.registry.set(String(option), value);
  }

  isScoreboardActive(): boolean {
    return !!this.getRegistry(GameOptions.Scoreboard);
  }

  // Helpers to handle Tiled tiles

  getTilesetProperties(tile: TiledGameObject, tileset: Phaser.Tilemaps.Tileset): TileProperties {
    return tileset.tileProperties[tile.gid - 1] as TileProperties;
  }

  consolidateProperties(tile: TiledGameObject) {
    if (Array.isArray(tile.properties)) {
      const properties = {};
      tile.properties.forEach((prop) => {
        properties[prop.name] = prop.value;
      });
      tile.properties = properties;
    }
  }

  // Helpers for gamepad

  updateGamepad() {
    (<any>this.input).update(); // https://github.com/photonstorm/phaser/issues/4414

    if (!this.gamepad && this.input.gamepad.getPad(0)) {
      // Gamepad just connected
      this.gamepad = this.input.gamepad.getPad(0);

      // Register events
      this.gamepad.on(Phaser.Input.Gamepad.Events.GAMEPAD_BUTTON_DOWN, (event) => {
        if (this.onGamepadPressed) {
          this.onGamepadPressed(event);
        }
      });
    }

    // Process axis events
    if (this.onGamepadPressed) {
      const actions: Partial<ActionState> = this.getGamepadActions();
      const newAxis: GamepadState = {
        [GamepadButtons.Right]: !!actions.right,
        [GamepadButtons.Left]: !!actions.left,
        [GamepadButtons.Up]: !!actions.jump,
        [GamepadButtons.Down]: !!actions.down,
      };

      Object.keys(newAxis).forEach((gamepadButton) => {
        if (newAxis[gamepadButton] && !this.prevAxis[gamepadButton]) {
          this.onGamepadPressed(Number(<any>gamepadButton)); // Cast to GamepadButtons
        }
      });

      this.prevAxis = newAxis;
    }
  }

  protected onGamepadPressed?(gamepadButton: GamepadButtons): void;

  getGamepadActions(): Partial<ActionState> {
    if (!this.gamepad || !this.gamepad.axes.length || !this.gamepad.buttons.length) {
      return {};
    }

    return {
      left: this.gamepad.axes[0].value < -GAMEPAD_AXIS_THRESHOLD,
      right: this.gamepad.axes[0].value > GAMEPAD_AXIS_THRESHOLD,
      jump: this.gamepad.axes[1].value < -GAMEPAD_AXIS_THRESHOLD || this.gamepad.buttons[GamepadButtons.A].pressed,
      down: this.gamepad.axes[1].value > GAMEPAD_AXIS_THRESHOLD,
      throwBible:
        this.gamepad.buttons[GamepadButtons.X].pressed ||
        this.gamepad.buttons[GamepadButtons.Y].pressed ||
        this.gamepad.buttons[GamepadButtons.B].pressed ||
        this.gamepad.buttons[GamepadButtons.R].pressed ||
        this.gamepad.buttons[GamepadButtons.L].pressed,
    };
  }
}
