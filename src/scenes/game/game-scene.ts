import { resizeGame } from '@game/helpers';
import { ActionState, TiledGameObject } from '@game/models';
import { TitleScene } from '@game/scenes/title';
import { BiblesGroup, BlockEmitter, BounceBrick, EnemyGroup, FinishLine, ModifierGroup, Player, PowerUpsGroup, World } from '@game/sprites';

import { BaseScene } from '../base';
import { AttractMode } from './attract-mode';
import { HUD } from './hud';
import { Keyboard } from './keyboard';
import { SoundEffects } from './music';
import { GamePad } from './pad';

export class GameScene extends BaseScene {
  static readonly SceneKey = 'GameScene';

  // Game
  attractMode: AttractMode;
  private gamePad: GamePad;
  private keyboard: Keyboard;
  world: World;
  soundEffects: SoundEffects;
  hud: HUD;

  // Sprite groups
  enemies: EnemyGroup;
  powerUps: PowerUpsGroup;
  modifiers: ModifierGroup;
  bibles: BiblesGroup;
  blockEmitter: BlockEmitter;

  // Sprites
  bounceBrick: BounceBrick;
  start: TiledGameObject;
  finishLine: FinishLine;
  player: Player;

  constructor() {
    super({ key: GameScene.SceneKey });
  }

  create() {
    resizeGame();

    this.attractMode = new AttractMode(this);
    this.gamePad = new GamePad(this);
    this.keyboard = new Keyboard(this, this.gamePad);
    this.world = new World(this);
    this.soundEffects = new SoundEffects(this);

    this.enemies = new EnemyGroup(this);
    this.powerUps = new PowerUpsGroup(this);
    this.modifiers = new ModifierGroup(this);
    this.bibles = new BiblesGroup(this);

    this.blockEmitter = new BlockEmitter(this);
    this.bounceBrick = new BounceBrick(this);
    this.finishLine = new FinishLine(this, this.modifiers.getFinishLine(), this.modifiers.getEnd());

    this.start = this.modifiers.getStart();
    this.player = new Player(this, this.start.x, this.start.y);
    this.hud = new HUD(this);

    // Set bounds for current room
    this.world.setRoomBounds();

    // The camera should follow the player
    this.cameras.main.startFollow(this.player);
    this.cameras.main.roundPixels = true;

    // Init background images
    this.world.init();

    this.physics.world.resume(); // If the game ended while physics was disabled
  }

  update(time: number, delta: number) {
    this.attractMode.update(delta);
    this.bibles.update();

    if (this.physics.world.isPaused) {
      return;
    }

    this.finishLine.update();
    this.hud.update(delta);
    this.enemies.update(delta);
    this.powerUps.update();

    let actions: Partial<ActionState>;

    if (this.finishLine.succeeded()) {
      actions = { right: true };
    } else if (this.attractMode.isActive()) {
      actions = this.attractMode.getCurrentFrame().actions;
    } else {
      actions = this.keyboard.getActions();
    }

    this.player.update(delta, actions);
    this.world.update();
    this.gamePad.update();
  }

  restart() {
    this.scene.start(TitleScene.SceneKey);
  }

  playerDied() {
    if (this.hud.updateLifes(-1) && !this.hud.hasTimedOut()) {
      // Still alive, go back to last checkpoint or start!
      const checkpoint = this.world.getCurrentCheckpoint();
      this.player.setPosition(checkpoint.x, checkpoint.y);
      this.world.setRoomBounds();
      this.player.init();
      this.player.startGraceTime();
    } else {
      // Run out of lifes
      this.restart();
    }
  }
}
