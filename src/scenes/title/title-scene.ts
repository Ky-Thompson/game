import { BibleAnimations, getPlayerAnimationKey, SPRITES_KEY, TitleAnimations } from '@game/animations';
import { FONT, IS_MOBILE, TILE_SIZE } from '@game/config';
import { AuthSteps, FirebaseUser, getUser, showAuth, signOut } from '@game/firebase';
import { Colors, GameOptions, PlayerActions, Players, PlayerStates } from '@game/models';

import { BaseScene, GamepadButtons } from '../base';
import { GameScene } from '../game';

const TITLE_BACKGROUND_HEIGHT = 8 * TILE_SIZE;
const TITLE_BACKGROUND_Y = 5 * TILE_SIZE;
const TITLE_BACKGROUND_ALPHA = 0.4;
const TITLE_BLINK_TIME = 500;
const TITLE_Y = TILE_SIZE * 5;
const TITLE_IMAGE = 'title';
const GAMEPAD_IMAGE = 'gamepad';

const START_TEXT = 'SELECT PLAYER TO START';
const START_X = 7 * TILE_SIZE;
const START_Y = 8 * TILE_SIZE;
const FONT_SIZE = TILE_SIZE / 2;

const PLAYER_SELECT_X = 8 * TILE_SIZE;
const PLAYER_SELECT_SCALE = 1.1;
const PLAYER_SELECT_DELAY = 100;
const PLAYER_SELECT_EASE = 'Quad.easeIn';
const PLAYER_SELECT_DURATION = 200;
const PLAYER_SPRITE_SCALE = 2;

const TITLE_BUTTONS_PADDING = TILE_SIZE / 2;
const TITLE_BUTTONS_ALPHA = 0.7;
const USER_NAME_X = TITLE_BUTTONS_PADDING + TILE_SIZE / 2;
const USER_NAME_Y = TILE_SIZE / 4;

const GAMEPAD_EXPLANATION_BACKDROP_ALPHA = 0.6;

export class TitleScene extends BaseScene {
  static readonly SceneKey = 'TitleScene';

  private backdrop: Phaser.GameObjects.Rectangle;
  private titleSprite: Phaser.GameObjects.Image;
  private startSprite: Phaser.GameObjects.BitmapText;
  private blinkTimer: number;
  private calebPlayerSprite: Phaser.GameObjects.Sprite;
  private calebSprite: Phaser.GameObjects.Sprite;
  private sophiaSprite: Phaser.GameObjects.Sprite;
  private sophiaPlayerSprite: Phaser.GameObjects.Sprite;
  private selectedPlayer: Players;
  private exitSprite: Phaser.GameObjects.Sprite;
  private profileSprite: Phaser.GameObjects.Sprite;
  private userNameSprite: Phaser.GameObjects.BitmapText;
  private showingGamepadExplanation: boolean;

  private calebJumpTimeout: number;
  private calebBendTimeout: number;
  private sophiaBibleTimeout: number;

  constructor() {
    super({ key: TitleScene.SceneKey });
  }

  create() {
    this.blinkTimer = TITLE_BLINK_TIME * 2;
    this.selectedPlayer = Players.Caleb;
    this.setRegistry(GameOptions.Player, Players.Caleb);
    this.setRegistry(GameOptions.Title, true);
    this.showingGamepadExplanation = false;

    this.initTitle();
    this.initDemo();
    this.initPlayerSelection();
    this.initExit();
    this.initProfile();
  }

  update(time: number, delta: number) {
    this.updateGamepad();
    this.checkRestartDemo();
    this.blinkTitle(delta);
  }

  // Methods for demo mode

  private initDemo() {
    this.setRegistry(GameOptions.Demo, true);
    this.setRegistry(GameOptions.RestartScene, false);
    this.setRegistry(GameOptions.Scoreboard, false);
    this.scene.launch(GameScene.SceneKey);
    this.scene.bringToTop();
  }

  private checkRestartDemo() {
    if (this.getRegistry(GameOptions.RestartScene)) {
      this.scene.stop(GameScene.SceneKey);
      this.scene.launch(GameScene.SceneKey);
      this.scene.bringToTop();
      this.setRegistry(GameOptions.RestartScene, false);
    }
  }

  private startGame() {
    if (this.calebBendTimeout) {
      clearTimeout(this.calebBendTimeout);
      this.calebBendTimeout = undefined;
    }

    if (this.calebJumpTimeout) {
      clearTimeout(this.calebJumpTimeout);
      this.calebJumpTimeout = undefined;
    }

    if (this.sophiaBibleTimeout) {
      clearTimeout(this.sophiaBibleTimeout);
      this.sophiaBibleTimeout = undefined;
    }

    try {
      this.scale.startFullscreen();
    } catch (e) {}

    this.scene.stop(GameScene.SceneKey);
    this.setRegistry(GameOptions.Demo, false);
    this.setRegistry(GameOptions.Title, false);
    this.scene.start(GameScene.SceneKey);
  }

  // Methods for the title

  private initTitle() {
    const { width } = this.getGameDimensions();

    this.backdrop = this.add
      .rectangle(width / 2, TITLE_BACKGROUND_Y, width, TITLE_BACKGROUND_HEIGHT, Colors.White, TITLE_BACKGROUND_ALPHA)
      .setScrollFactor(0, 0);
    this.titleSprite = this.add.image(width / 2, TITLE_Y, TITLE_IMAGE).setScrollFactor(0, 0);
    this.startSprite = this.add.bitmapText(START_X, START_Y, FONT, START_TEXT, FONT_SIZE).setScrollFactor(0, 0);
  }

  private hideTitle() {
    this.startSprite.setActive(false).setAlpha(0);
    this.titleSprite.setActive(false).setAlpha(0);
  }

  private initPlayerSelection() {
    const { width } = this.getGameDimensions();

    // Create player selection
    this.calebPlayerSprite = this.add.sprite(width / 2 - PLAYER_SELECT_X, TITLE_Y, SPRITES_KEY);
    this.calebPlayerSprite.play(TitleAnimations.Player);

    this.tweens.add({
      targets: this.calebPlayerSprite,
      scaleX: PLAYER_SELECT_SCALE,
      scaleY: PLAYER_SELECT_SCALE,
      yoyo: true,
      loop: -1,
      loopDelay: PLAYER_SELECT_DELAY,
      ease: PLAYER_SELECT_EASE,
      duration: PLAYER_SELECT_DURATION,
    });

    this.sophiaPlayerSprite = this.add.sprite(width / 2 + PLAYER_SELECT_X, TITLE_Y, SPRITES_KEY);
    this.sophiaPlayerSprite.play(TitleAnimations.Player);

    this.tweens.add({
      targets: this.sophiaPlayerSprite,
      scaleX: PLAYER_SELECT_SCALE,
      scaleY: PLAYER_SELECT_SCALE,
      yoyo: true,
      loop: -1,
      loopDelay: PLAYER_SELECT_DELAY,
      ease: PLAYER_SELECT_EASE,
      duration: PLAYER_SELECT_DURATION,
    });

    if (!IS_MOBILE) {
      this.calebPlayerSprite.setAlpha(0);
      this.sophiaPlayerSprite.setAlpha(0);
    }

    // Create Caleb sprite
    const calebAnimation = getPlayerAnimationKey(Players.Caleb, PlayerActions.Walk, PlayerStates.Big);
    this.calebSprite = this.add.sprite(width / 2 - PLAYER_SELECT_X, TITLE_Y, SPRITES_KEY);
    this.calebSprite
      .setFlipX(true)
      .setScale(PLAYER_SPRITE_SCALE)
      .play(calebAnimation)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.selectPlayer(Players.Caleb);
        this.showGamepadExplanation();
      });

    // Create Sophia sprite
    this.sophiaSprite = this.add.sprite(width / 2 + PLAYER_SELECT_X, TITLE_Y, SPRITES_KEY);
    const sophiaAnimation = getPlayerAnimationKey(Players.Sophia, PlayerActions.Walk, PlayerStates.Big);
    this.sophiaSprite
      .setFlipX(false)
      .setScale(PLAYER_SPRITE_SCALE)
      .play(sophiaAnimation)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.selectPlayer(Players.Sophia);
        this.showGamepadExplanation();
      });

    // Toggle and select player
    this.selectPlayer(Players.Caleb);
    if (!IS_MOBILE) {
      this.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, (event: Phaser.Input.Keyboard.Key) => {
        switch (event.keyCode) {
          case Phaser.Input.Keyboard.KeyCodes.RIGHT:
          case Phaser.Input.Keyboard.KeyCodes.LEFT:
            this.togglePlayer();
            break;
          case Phaser.Input.Keyboard.KeyCodes.ENTER:
            this.showGamepadExplanation();
            break;
        }
      });
    }
  }

  private hidePlayerSelection() {
    this.calebPlayerSprite.setActive(false).setAlpha(0);
    this.sophiaPlayerSprite.setActive(false).setAlpha(0);
    this.calebSprite.setActive(false).setAlpha(0);
    this.sophiaSprite.setActive(false).setAlpha(0);
  }

  private blinkTitle(delta: number) {
    if (this.titleSprite.alpha === 0) {
      return;
    }

    this.blinkTimer -= delta;

    if (this.blinkTimer < 0) {
      this.startSprite.setAlpha(this.startSprite.alpha === 1 ? 0 : 1); // Toggle alpha
      this.blinkTimer = TITLE_BLINK_TIME; // Restart timer
    }
  }

  // Methods for the player selection

  private selectPlayer(player: Players) {
    this.selectedPlayer = player;
    this.setRegistry(GameOptions.Player, player);

    if (!IS_MOBILE) {
      switch (player) {
        case Players.Caleb:
          this.calebSprite.play(getPlayerAnimationKey(Players.Caleb, PlayerActions.Walk, PlayerStates.Big));
          this.sophiaSprite.play(getPlayerAnimationKey(Players.Sophia, PlayerActions.Stand, PlayerStates.Big));
          this.calebPlayerSprite.setAlpha(1);
          this.sophiaPlayerSprite.setAlpha(0);
          break;
        case Players.Sophia:
          this.calebSprite.play(getPlayerAnimationKey(Players.Caleb, PlayerActions.Stand, PlayerStates.Big));
          this.sophiaSprite.play(getPlayerAnimationKey(Players.Sophia, PlayerActions.Walk, PlayerStates.Big));
          this.calebPlayerSprite.setAlpha(0);
          this.sophiaPlayerSprite.setAlpha(1);
          break;
      }
    }
  }

  private togglePlayer() {
    if (this.showingGamepadExplanation) {
      return;
    }

    if (this.selectedPlayer === Players.Caleb) {
      this.selectPlayer(Players.Sophia);
    } else {
      this.selectPlayer(Players.Caleb);
    }
  }

  protected onGamepadPressed(gamepadButton: GamepadButtons) {
    switch (gamepadButton) {
      case GamepadButtons.Right:
      case GamepadButtons.Left:
        this.togglePlayer();
        break;
      case GamepadButtons.Select:
      case GamepadButtons.Start:
      case GamepadButtons.A:
        if (!this.showingGamepadExplanation) {
          this.showGamepadExplanation();
        } else {
          this.startGame();
        }
        break;
    }
  }

  // Methods for the exit button

  private initExit() {
    const { width } = this.getGameDimensions();

    this.exitSprite = this.add
      .sprite(width - TITLE_BUTTONS_PADDING, TITLE_BUTTONS_PADDING, SPRITES_KEY)
      .play(TitleAnimations.Exit)
      .setAlpha(TITLE_BUTTONS_ALPHA)
      .setInteractive({ useHandCursor: true });

    this.exitSprite.on(Phaser.Input.Events.POINTER_DOWN, () => {
      signOut();
    });
  }

  private async initProfile() {
    const user: FirebaseUser = await getUser();

    this.setRegistry(GameOptions.Exhibit, user.exhibit);

    if (user.exhibit) {
      document.documentElement.style.cursor = 'none'; // Hide cursor
    }

    this.profileSprite = this.add
      .sprite(TITLE_BUTTONS_PADDING, TITLE_BUTTONS_PADDING, SPRITES_KEY)
      .play(TitleAnimations.Profile)
      .setAlpha(user.exhibit ? 0 : TITLE_BUTTONS_ALPHA) // If exhibit no need to show profile button
      .setInteractive({ useHandCursor: true });

    this.userNameSprite = this.add
      .bitmapText(USER_NAME_X, USER_NAME_Y, FONT, user.displayName, FONT_SIZE)
      .setAlpha(user.exhibit ? 0 : TITLE_BUTTONS_ALPHA) // If exhibit no need to show profile button
      .setTint(Colors.DarkBlue)
      .setInteractive({ useHandCursor: true });

    this.profileSprite.on(Phaser.Input.Events.POINTER_DOWN, () => {
      showAuth(AuthSteps.DisplayName);
    });

    this.userNameSprite.on(Phaser.Input.Events.POINTER_DOWN, () => {
      showAuth(AuthSteps.DisplayName);
    });
  }

  private hideProfileExit() {
    this.exitSprite.setAlpha(0);
    this.profileSprite.setAlpha(0);
    this.userNameSprite.setAlpha(0);
  }

  // Methods for the gamepad explanation

  private showGamepadExplanation() {
    if (this.hasGamepad()) {
      this.hidePlayerSelection();
      this.hideTitle();
      this.hideProfileExit();

      this.initGamepadExplanation();
    } else {
      this.startGame();
    }
  }

  private initGamepadExplanation() {
    if (this.showingGamepadExplanation) {
      return;
    }

    this.showingGamepadExplanation = true;

    const { width, height } = this.getGameDimensions();

    this.backdrop.destroy();
    this.backdrop = this.add
      .rectangle(width / 2, height / 2, width, height, Colors.White, GAMEPAD_EXPLANATION_BACKDROP_ALPHA)
      .setScrollFactor(0, 0);

    // Gamepad
    this.add.image(width / 2, height / 2 - TILE_SIZE * 3, GAMEPAD_IMAGE).setScrollFactor(0, 0);

    // Player tips
    const calebJumpSuper = getPlayerAnimationKey(Players.Caleb, PlayerActions.Jump, PlayerStates.Super);
    const calebStandSuper = getPlayerAnimationKey(Players.Caleb, PlayerActions.Stand, PlayerStates.Super);
    const calebStand = getPlayerAnimationKey(Players.Caleb, PlayerActions.Stand, PlayerStates.Big);
    const calebBend = getPlayerAnimationKey(Players.Caleb, PlayerActions.Bend, PlayerStates.Big);
    const sophiaStandSuper = getPlayerAnimationKey(Players.Sophia, PlayerActions.Stand, PlayerStates.Super);
    const sophiaWalk = getPlayerAnimationKey(Players.Sophia, PlayerActions.Walk, PlayerStates.Big);

    const calebJumpSprite = this.add
      .sprite(TILE_SIZE * 21, TILE_SIZE * 4, SPRITES_KEY)
      .play(calebJumpSuper)
      .setScale(2)
      .setScrollFactor(0, 0);

    this.tweens.add({
      targets: calebJumpSprite,
      loop: -1,
      yoyo: true,
      y: TILE_SIZE * 3,
      duration: 200,
      loopDelay: 500,
      ease: 'Quad.easeOut',
      onLoop: () => {
        calebJumpSprite.play(calebStandSuper);
        this.calebJumpTimeout = window.setTimeout(() => {
          if (calebJumpSprite) {
            calebJumpSprite.play(calebJumpSuper);
          }
        }, 500);
      },
    });

    this.add
      .sprite(TILE_SIZE * 15, TILE_SIZE * 9.5, SPRITES_KEY)
      .play(sophiaStandSuper)
      .setScale(2)
      .setScrollFactor(0, 0);

    this.add
      .sprite(TILE_SIZE * 4, TILE_SIZE * 4, SPRITES_KEY)
      .play(sophiaWalk)
      .setScale(2)
      .setScrollFactor(0, 0);

    const calebBendSprite = this.add
      .sprite(TILE_SIZE * 9, TILE_SIZE * 9.5, SPRITES_KEY)
      .play(calebBend)
      .setScale(2)
      .setScrollFactor(0, 0);

    this.tweens.add({
      targets: calebBendSprite,
      loop: -1,
      yoyo: true,
      y: TILE_SIZE * 9.5,
      duration: 200,
      loopDelay: 500,
      onLoop: () => {
        calebBendSprite.play(calebStand);
        this.calebBendTimeout = window.setTimeout(() => {
          if (calebBendSprite) {
            calebBendSprite.play(calebBend);
          }
        }, 500);
      },
    });

    const bibleSophia = this.add
      .sprite(TILE_SIZE * 15, TILE_SIZE * 9.5, SPRITES_KEY)
      .play(BibleAnimations.Fly)
      .setScale(2)
      .setScrollFactor(0, 0);
    this.physics.world.enable(bibleSophia);
    (<Phaser.Physics.Arcade.Body>bibleSophia.body).setAllowGravity(false);
    (<Phaser.Physics.Arcade.Body>bibleSophia.body).angularVelocity = 500;

    this.tweens.add({
      targets: bibleSophia,
      loop: -1,
      x: TILE_SIZE * 23,
      y: TILE_SIZE * 10.5,
      duration: 800,
      loopDelay: 500,
      onLoop: () => {
        bibleSophia.setAlpha(0);
        this.sophiaBibleTimeout = window.setTimeout(() => {
          if (bibleSophia) {
            bibleSophia.setAlpha(1);
          }
        }, 550);
      },
    });

    // Button explanation
    this.add.bitmapText(TILE_SIZE * 1.5, TILE_SIZE * 6.5, FONT, 'RIGHT LEFT', FONT_SIZE).setTint(Colors.DarkBlue);
    this.add.bitmapText(TILE_SIZE * 1.5, TILE_SIZE * 7.5, FONT, '   WALK   ', FONT_SIZE).setTint(Colors.DarkBlue);

    this.add.bitmapText(TILE_SIZE * 8, TILE_SIZE * 12, FONT, 'DOWN', FONT_SIZE).setTint(Colors.DarkBlue);
    this.add.bitmapText(TILE_SIZE * 8, TILE_SIZE * 13, FONT, 'BEND', FONT_SIZE).setTint(Colors.DarkBlue);

    this.add.bitmapText(TILE_SIZE * 12.5 + FONT_SIZE / 2, TILE_SIZE * 12, FONT, ' B BUTTON ', FONT_SIZE).setTint(Colors.DarkBlue);
    this.add.bitmapText(TILE_SIZE * 12.5, TILE_SIZE * 13, FONT, 'THROW BIBLE', FONT_SIZE).setTint(Colors.DarkBlue);

    this.add.bitmapText(TILE_SIZE * 18.5, TILE_SIZE * 6.5, FONT, ' A BUTTON ', FONT_SIZE).setTint(Colors.DarkBlue);
    this.add.bitmapText(TILE_SIZE * 18.5, TILE_SIZE * 7.5, FONT, '   JUMP   ', FONT_SIZE).setTint(Colors.DarkBlue);
  }
}
