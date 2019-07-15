import { GtmEventTypes, pushEvent } from '@game/analytics';
import { MS_TO_S } from '@game/config';
import { uploading } from '@game/firebase';
import { ActionState, GameOptions, TiledGameObject } from '@game/models';
import { createMediaRecorder, startRecording, stopRecording } from '@game/recorder';
import { TitleScene } from '@game/scenes/title';
import { BiblesGroup, BlockEmitter, BounceBrick, EnemyGroup, FinishLine, ModifierGroup, Player, PowerUpsGroup, World } from '@game/sprites';

import { BaseScene, GamepadButtons } from '../base';
import { ScoreboardScene } from '../scoreboard';
import { Demo } from './demo';
import { EndTitle } from './end-title';
import { HUD } from './hud';
import { Keyboard } from './keyboard';
import { Menu } from './menu';
import { SoundEffects } from './music';
import { VirtualPad } from './pad';

const SCOREBOARD_TIMEOUT = 30 * MS_TO_S;
const RESTART_LIMIT = 10;

export class GameScene extends BaseScene {
  private static RestartCount: number = 0;
  static readonly SceneKey = 'GameScene';

  // Game
  demo: Demo;
  private virtualPad: VirtualPad;
  private keyboard: Keyboard;
  world: World;
  soundEffects: SoundEffects;
  hud: HUD;
  endTitle: EndTitle;
  menu: Menu;

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
    if (GameScene.RestartCount >= RESTART_LIMIT && this.getRegistry(GameOptions.Demo) && !uploading) {
      return window.location.reload(); // Force reload to avoid memory leaks and game getting stuck
    }

    GameScene.RestartCount++;

    if (!this.isScoreboardActive() && !this.getRegistry(GameOptions.Demo)) {
      pushEvent({ event: GtmEventTypes.GameStart });
    }

    this.world = new World(this);
    this.demo = new Demo(this);
    this.virtualPad = new VirtualPad(this);
    this.keyboard = new Keyboard(this, this.virtualPad);
    this.soundEffects = new SoundEffects(this);
    this.endTitle = new EndTitle(this);
    this.menu = new Menu(this);

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
    if (this.isScoreboardActive()) {
      this.panOverWorld();
    } else {
      this.followPlayer();
    }

    // Init background images
    this.world.init();

    this.physics.world.resume(); // If the game ended while physics was disabled
    this.anims.resumeAll(); // If the game ended while animations were disabled
    this.soundEffects.setMusicRate(1);

    // Init recording
    if (!this.isScoreboardActive() && this.demo.isActive()) {
      if (this.getRegistry(GameOptions.Exhibit)) {
        createMediaRecorder('game', (this.sound as any).context);
        startRecording();
      } else {
        stopRecording();
      }
    }
  }

  update(time: number, delta: number) {
    this.updateGamepad();

    this.endTitle.update(delta);
    this.menu.update(delta);
    this.demo.update(delta);
    this.bibles.update();

    if (this.physics.world.isPaused) {
      return;
    }

    let actions: Partial<ActionState> = {};

    if (this.finishLine.succeeded()) {
      actions = { right: true };
    } else if (this.demo.isActive()) {
      actions = this.demo.getActions();
    } else {
      actions = this.keyboard.getActions();
    }

    this.finishLine.update();
    this.hud.update(delta);
    this.enemies.update(delta);
    this.powerUps.update();

    this.player.update(delta, actions);
    this.world.update();
    this.virtualPad.update();
  }

  restart() {
    this.scene.start(TitleScene.SceneKey);
  }

  goScoreboard() {
    this.scene.start(ScoreboardScene.SceneKey);
  }

  followPlayer() {
    this.cameras.main.startFollow(this.player, true);
  }

  stopFollowingPlayer() {
    this.cameras.main.stopFollow();
  }

  panOverWorld() {
    this.cameras.main.pan(this.world.size().width - this.getGameDimensions().width / 2, 0, SCOREBOARD_TIMEOUT);
  }

  playerDied() {
    if (this.hud.updateLives(-1) && !this.hud.hasTimedOut()) {
      // Still alive, go back to last checkpoint or start!
      const checkpoint = this.world.getCurrentCheckpoint();
      this.player.setPosition(checkpoint.x, checkpoint.y);
      this.world.setRoomBounds();
      this.player.init();
      this.player.startGraceTime();
      window.setTimeout(() => this.soundEffects.resumeMusic(), 800);
    } else if (this.hud.hasTimedOut()) {
      pushEvent({ event: GtmEventTypes.GameTimeout });
      this.endTitle.showTimeout();
    } else if (this.hud.noLives()) {
      pushEvent({ event: GtmEventTypes.GameOver });
      this.endTitle.showGameOver();
    } else {
      this.restart();
    }
  }

  protected onGamepadPressed(gamepadButton: GamepadButtons) {
    this.menu.handleGamepadPressed(gamepadButton);
  }
}
