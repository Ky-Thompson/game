import * as AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

import { TiledGameObject } from '../../models';
import { BlockEmitter, BounceBrick, FinishLine, Player } from '../../sprites';
import { BaseScene } from '../base';
import { AttractMode, GamePad, HUD, Keyboard, SoundEffects } from './interfaces';
import { EnemyGroup, FireballsGroup, ModifierGroup, PowerUpGroup, World } from './sprite-groups';

export class GameScene extends BaseScene {
  static readonly SceneKey = 'GameScene';

  // Game
  private pluginsLodaded: boolean;
  attractMode: AttractMode;
  private gamePad: GamePad;
  private keyboard: Keyboard;
  world: World;
  soundEffects: SoundEffects;
  hud: HUD;

  // Sprite groups
  enemies: EnemyGroup;
  powerUps: PowerUpGroup;
  modifiers: ModifierGroup;
  fireballs: FireballsGroup;
  blockEmitter: BlockEmitter;

  // Sprites
  bounceBrick: BounceBrick;
  start: TiledGameObject;
  finishLine: FinishLine;
  player: Player;

  constructor() {
    super({ key: GameScene.SceneKey });
  }

  preload() {
    if (!this.pluginsLodaded) {
      // TODO: Use enum, rename or fix
      this.load.scenePlugin('animatedTiles', AnimatedTiles, 'animatedTiles', 'animatedTiles');
      this.pluginsLodaded = true;
    }
  }

  create() {
    this.attractMode = new AttractMode(this);
    this.gamePad = new GamePad(this);
    this.keyboard = new Keyboard(this, this.gamePad);
    this.world = new World(this);
    this.soundEffects = new SoundEffects(this);

    this.enemies = new EnemyGroup(this, this.world);
    this.powerUps = new PowerUpGroup(this, this.world);
    this.modifiers = new ModifierGroup(this, this.world);
    this.fireballs = new FireballsGroup(this);

    this.blockEmitter = new BlockEmitter(this);
    this.bounceBrick = new BounceBrick(this);
    this.finishLine = new FinishLine(this, this.modifiers.getFinishLine());

    this.start = this.modifiers.getStart();
    this.player = new Player(this, this.start.x, this.start.y);
    this.hud = new HUD(this);

    // Set bounds for current room
    this.world.setRoomBounds();

    // The camera should follow the player
    this.cameras.main.startFollow(this.player);
    this.cameras.main.roundPixels = true;

    this.physics.world.resume(); // If the game ended while physics was disabled
  }

  update(time: number, delta: number) {
    this.attractMode.update(delta);
    this.fireballs.update(time, delta);

    if (this.physics.world.isPaused) {
      return;
    }

    this.finishLine.update(delta);
    this.hud.update(delta);
    this.enemies.update(time, delta); // TODO: Remove time from all
    this.powerUps.update(time, delta);

    this.player.update(time, delta, this.attractMode.isActive() ? this.attractMode.getCurrentFrame().keys : this.keyboard.getActions());
    this.gamePad.update();
  }
}
