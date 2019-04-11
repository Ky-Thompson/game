import { getPlayerAnimationKey, SPRITES_KEY, TitleAnimations } from '@game/animations';
import { FONT } from '@game/config';
import { Colors, GameOptions, PlayerActions, Players, PlayerStates } from '@game/models';

import { BaseScene } from '../base';
import { GameScene } from '../game';
import {
  PLAYER_SELECT_DELAY,
  PLAYER_SELECT_DURATION,
  PLAYER_SELECT_EASE,
  PLAYER_SELECT_SCALE,
  PLAYER_SELECT_X,
  PLAYER_SPRITE_SCALE,
  START_SIZE,
  START_TEXT,
  START_X,
  START_Y,
  TITLE_BACKGROUND_ALPHA,
  TITLE_BACKGROUND_HEIGHT,
  TITLE_BACKGROUND_Y,
  TITLE_BLINK_TIME,
  TITLE_Y,
} from './constants';

export class TitleScene extends BaseScene {
  static readonly SceneKey = 'TitleScene';

  private startSprite: Phaser.GameObjects.BitmapText;
  private blinkTimer: number = TITLE_BLINK_TIME * 2;
  private playerSprite: Phaser.GameObjects.Sprite;
  private selectedPlayer: Players = Players.Caleb;

  constructor() {
    super({ key: TitleScene.SceneKey });
  }

  create() {
    this.createTitle();
    this.createAttractMode();
    this.createPlayerSelection();
  }

  update(time: number, delta: number) {
    this.checkRestartAttractMode();
    this.blinkTitle(delta);
  }

  /**
   * Methods for attract mode
   */

  private createAttractMode() {
    this.setRegistry(GameOptions.AttractMode, true);
    this.setRegistry(GameOptions.RestartScene, false);
    this.scene.launch(GameScene.SceneKey);
    this.scene.bringToTop();
  }

  private checkRestartAttractMode() {
    if (this.getRegistry(GameOptions.RestartScene)) {
      this.scene.stop(GameScene.SceneKey);
      this.scene.launch(GameScene.SceneKey);
      this.scene.bringToTop(GameScene.SceneKey);
      this.setRegistry(GameOptions.RestartScene, false);
    }
  }

  private startGame() {
    this.scene.stop(GameScene.SceneKey);
    this.setRegistry(GameOptions.AttractMode, false);
    this.scene.start(GameScene.SceneKey);
  }

  /**
   * Methods for the title
   */

  private createTitle() {
    const { width } = this.gameConfig();

    this.add.rectangle(width / 2, TITLE_BACKGROUND_Y, width, TITLE_BACKGROUND_HEIGHT, Colors.White, TITLE_BACKGROUND_ALPHA);

    const title: Phaser.GameObjects.Sprite = this.add.sprite(width / 2, TITLE_Y, SPRITES_KEY);
    title.play(TitleAnimations.Title);

    this.startSprite = this.add.bitmapText(START_X, START_Y, FONT, START_TEXT, START_SIZE);
  }

  private createPlayerSelection() {
    const { width } = this.gameConfig();

    // Create player selection
    this.playerSprite = this.add.sprite(width / 2 - PLAYER_SELECT_X, TITLE_Y, SPRITES_KEY);
    this.playerSprite.play(TitleAnimations.Player);

    this.tweens.add({
      targets: this.playerSprite,
      scaleX: PLAYER_SELECT_SCALE,
      scaleY: PLAYER_SELECT_SCALE,
      yoyo: true,
      loop: -1,
      loopDelay: PLAYER_SELECT_DELAY,
      ease: PLAYER_SELECT_EASE,
      duration: PLAYER_SELECT_DURATION,
    });

    if (this.isMobile()) {
      this.playerSprite.setAlpha(0);
    }

    // Create Caleb sprite
    const caleb: Phaser.GameObjects.Sprite = this.add.sprite(width / 2 - PLAYER_SELECT_X, TITLE_Y, SPRITES_KEY);
    const calebAnimation = getPlayerAnimationKey(Players.Caleb, PlayerActions.Stand, PlayerStates.Big);
    caleb.flipX = true;
    caleb.setScale(PLAYER_SPRITE_SCALE);
    caleb.play(calebAnimation);
    caleb.setInteractive();
    caleb.on('pointerdown', () => {
      this.selectPlayer(Players.Caleb);
      this.startGame();
    });

    // Create Sophia sprite
    const sophia: Phaser.GameObjects.Sprite = this.add.sprite(width / 2 + PLAYER_SELECT_X, TITLE_Y, SPRITES_KEY);
    const sophiaAnimation = getPlayerAnimationKey(Players.Sophia, PlayerActions.Stand, PlayerStates.Big);
    sophia.flipX = false;
    sophia.setScale(PLAYER_SPRITE_SCALE);
    sophia.play(sophiaAnimation);
    sophia.setInteractive();
    sophia.on('pointerdown', () => {
      this.selectPlayer(Players.Sophia);
      this.startGame();
    });

    // Toggle and select player
    this.selectPlayer(Players.Caleb);
    this.input.keyboard.on('keydown', (event: Phaser.Input.Keyboard.Key) => {
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.RIGHT:
        case Phaser.Input.Keyboard.KeyCodes.LEFT:
          this.togglePlayer();
          break;
        case Phaser.Input.Keyboard.KeyCodes.ENTER:
          this.startGame();
          break;
      }
    });
  }

  private blinkTitle(delta: number) {
    this.blinkTimer -= delta;

    if (this.blinkTimer < 0) {
      this.startSprite.alpha = this.startSprite.alpha === 1 ? 0 : 1; // Toggle alpha
      this.blinkTimer = TITLE_BLINK_TIME; // Restart timer
    }
  }

  /**
   * Methods for the player selection
   */

  private selectPlayer(player: Players) {
    this.selectedPlayer = player;
    this.setRegistry(GameOptions.Player, player);

    const { width } = this.gameConfig();
    const position: number = player === Players.Caleb ? -1 : 1;
    this.playerSprite.setPosition(width / 2 + PLAYER_SELECT_X * position, TITLE_Y);
  }

  private togglePlayer() {
    if (this.selectedPlayer === Players.Caleb) {
      this.selectPlayer(Players.Sophia);
    } else {
      this.selectPlayer(Players.Caleb);
    }
  }
}
