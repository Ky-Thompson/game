import { getPlayerAnimationKey, SPRITES_KEY } from '@game/animations';
import { FONT, MS_TO_S, TILE_SIZE } from '@game/config';
import { FirebaseScore, FirebaseUser, getUser, listScores, MAX_DISPLAY_NAME, saveScore } from '@game/firebase';
import { Colors, GameOptions, PlayerActions, Players, PlayerStates } from '@game/models';

import { BaseScene } from '../base';
import { GameScene } from '../game';
import { TitleScene } from '../title';

const BLINK_TIME = 500;

const NAME_TEXT = 'ENTER YOUR NAME';
const NAME_CURSOR = '_';
const NAME_Y = TILE_SIZE * 1.5;

const SCOREBOARD_TIMEOUT = 100 * MS_TO_S;
const SCOREBOARD_Y = TILE_SIZE;
const SCOREBOARD_BACKGROUND_ALPHA = 0.8;
const SCOREBOARD_TEXT = 'SCOREBOARD';
const SCOREBOARD_TEXT_SIZE = TILE_SIZE;

const MAX_SCORES = 8;
const SCORES_TEXT_SIZE = TILE_SIZE;
const SCORES_X = TILE_SIZE * 2.5;
const SCORES_BASE_Y = TILE_SIZE * 3;
const SCORES_PADDING = TILE_SIZE / 4;
const NUMBER_TEXT_PADDING = 2;
const NAME_TEXT_PADDING = 9;
const SCORE_TEXT_PADDING = 5;
const PLAYER_Y = 12;

const SCORE_TEXT = 'YOUR SCORE';

export class ScoreboardScene extends BaseScene {
  static readonly SceneKey = 'ScoreboardScene';

  private static Scores: FirebaseScore[] = [];
  private static User: FirebaseUser;
  private static Score: number = 0;
  private static Player: Players = Players.Caleb;

  private static async LoadScores() {
    ScoreboardScene.Scores = await listScores();
  }

  static async SetLastScore(score: number, player: Players) {
    ScoreboardScene.User = await getUser();
    ScoreboardScene.Score = score;
    ScoreboardScene.Player = player;
  }

  static async SaveLastScore(displayName: string) {
    await saveScore(ScoreboardScene.Score, ScoreboardScene.Player, displayName || ScoreboardScene.User.displayName);
  }

  static get isExhibit() {
    return !ScoreboardScene.User || ScoreboardScene.User.exhibit;
  }

  private enterNameInitalized: boolean = false;
  private enterNameEvent: Phaser.Events.EventEmitter;
  private enterNameSprite: Phaser.GameObjects.BitmapText;
  private nameSprites: Phaser.GameObjects.BitmapText[] = [];
  private nameCursorSprite: Phaser.GameObjects.BitmapText;
  private name: string = '';
  private nameBlinkTimer: number = BLINK_TIME;

  private scoreSprite: Phaser.GameObjects.BitmapText;
  private scoreBlinkTimer: number = BLINK_TIME * 2;

  private timeout: number = 0;

  constructor() {
    super({ key: ScoreboardScene.SceneKey });
  }

  create() {
    this.initScene();

    if (ScoreboardScene.isExhibit) {
      this.initName();
    } else {
      this.initScoreboard();
    }
  }

  update(time: number, delta: number) {
    if (ScoreboardScene.isExhibit) {
      this.blinkCursor(delta);
    } else {
      this.blinkYourScore(delta);

      this.timeout += delta;
      if (this.timeout > SCOREBOARD_TIMEOUT) {
        this.scene.start(TitleScene.SceneKey);
      }
    }
  }

  // Methods for scoreboard mode

  private initScene() {
    const { width, height } = this.getGameDimensions();

    this.setRegistry(GameOptions.Scoreboard, true);
    this.scene.launch(GameScene.SceneKey);
    this.add.rectangle(width / 2, height / 2, width, height, Colors.Gray, SCOREBOARD_BACKGROUND_ALPHA);
    this.scene.bringToTop();
  }

  // Methods for the name input

  private initName() {
    this.initNameTitle();
    this.initNameInput();
    this.enterNameInitalized = true;
  }

  private destroyName() {
    if (!this.enterNameInitalized) {
      return;
    }

    this.enterNameSprite.destroy();
    this.nameCursorSprite.destroy();
    this.nameSprites.forEach((sprite: Phaser.GameObjects.BitmapText) => sprite.destroy());

    this.enterNameSprite = undefined;
    this.nameCursorSprite = undefined;
    this.nameSprites = undefined;

    this.enterNameEvent.shutdown();
  }

  private initNameTitle() {
    const { width, height } = this.getGameDimensions();
    const x: number = width / 2 - (NAME_TEXT.length * SCOREBOARD_TEXT_SIZE) / 2;
    const y: number = height / 2 - NAME_Y;

    this.enterNameSprite = this.add.bitmapText(x, y, FONT, NAME_TEXT, SCOREBOARD_TEXT_SIZE).setTint(Colors.Red);
  }

  private initNameInput() {
    const { width, height } = this.getGameDimensions();
    const x: number = width / 2 - (NAME_CURSOR.length * SCOREBOARD_TEXT_SIZE) / 2;
    const y: number = height / 2 - NAME_Y;

    this.nameCursorSprite = this.add.bitmapText(x, y + NAME_Y * 2, FONT, NAME_CURSOR, SCOREBOARD_TEXT_SIZE);

    this.enterNameEvent = this.input.keyboard.on('keydown', async (event: KeyboardEvent) => {
      if ((isSpace(event) || isLetter(event) || isNumber(event)) && this.name.length < MAX_DISPLAY_NAME) {
        // Add letter
        const letter: string = event.key.toUpperCase();
        const newLetter = this.add.bitmapText(this.nameCursorSprite.x, this.nameCursorSprite.y, FONT, letter, SCOREBOARD_TEXT_SIZE);
        this.nameSprites.push(newLetter);
        this.name += letter;
      } else if (isBackspace(event) && this.name.length > 0) {
        const lastLetter = this.nameSprites.pop();
        lastLetter.destroy();
        this.name = this.name.substring(0, this.name.length - 1);
      }

      // Update position
      const showCursor = this.name.length < MAX_DISPLAY_NAME;
      let letterX: number = width / 2 - ((this.nameSprites.length + (showCursor ? 1 : 0)) * SCOREBOARD_TEXT_SIZE) / 2;
      this.nameSprites.forEach((sprite: Phaser.GameObjects.BitmapText) => {
        sprite.setX(letterX);
        letterX += SCOREBOARD_TEXT_SIZE;
      });
      this.nameCursorSprite.setX(letterX);

      // Handle submit
      const name: string = this.name.trim().toUpperCase();
      if (name.length && name.length <= MAX_DISPLAY_NAME && isEnter(event)) {
        await this.initScoreboard();
      }
    });
  }

  private blinkCursor(delta: number) {
    if (!this.nameCursorSprite) {
      return;
    }

    if (this.name.length === MAX_DISPLAY_NAME) {
      this.nameCursorSprite.setAlpha(0);
      this.nameBlinkTimer = BLINK_TIME; // Restart timer
    } else {
      this.nameBlinkTimer -= delta;

      if (this.nameBlinkTimer < 0) {
        this.nameCursorSprite.setAlpha(this.nameCursorSprite.alpha === 1 ? 0 : 1); // Toggle alpha
        this.nameBlinkTimer = BLINK_TIME; // Restart timer
      }
    }
  }

  // Methods for the score list

  private async initScoreboard() {
    await ScoreboardScene.SaveLastScore(this.name);
    await ScoreboardScene.LoadScores();
    this.destroyName();
    this.initScoreboardTitle();
    this.initScores();
    this.initYourScore();
    this.input.on('pointerdown', () => this.scene.start(TitleScene.SceneKey));
  }

  private initScoreboardTitle() {
    const { width } = this.getGameDimensions();
    const x: number = width / 2 - (SCOREBOARD_TEXT.length * SCOREBOARD_TEXT_SIZE) / 2;
    this.add.bitmapText(x, SCOREBOARD_Y, FONT, SCOREBOARD_TEXT, SCOREBOARD_TEXT_SIZE).setTint(Colors.Red);
  }

  private initScores() {
    const scores: FirebaseScore[] = [...ScoreboardScene.Scores];

    if (scores.length > MAX_SCORES) {
      scores.length = MAX_SCORES; // Trim
    }

    scores.forEach((firebaseScore: FirebaseScore, index: number) => {
      const numberText: string = `${index + 1}.`.padEnd(NUMBER_TEXT_PADDING, ' ');
      const displayName: string = firebaseScore.displayName.toLocaleUpperCase().padEnd(NAME_TEXT_PADDING, ' ');
      const score: string = String(firebaseScore.score).padStart(SCORE_TEXT_PADDING, '0');
      const scoreText: string = `${numberText} ${displayName} ${score}`;
      const scoreY: number = SCORES_BASE_Y + index * (SCORES_TEXT_SIZE + SCORES_PADDING);

      // Text
      this.add.bitmapText(SCORES_X, scoreY, FONT, scoreText, SCORES_TEXT_SIZE);

      // Player
      const playerAnimation = getPlayerAnimationKey(firebaseScore.player, PlayerActions.Walk, PlayerStates.Default);
      const playerX = SCORES_X + scoreText.length * SCORES_TEXT_SIZE + SCORES_TEXT_SIZE;
      this.add.sprite(playerX, scoreY + PLAYER_Y, SPRITES_KEY).play(playerAnimation);
    });
  }

  private initYourScore() {
    const { width, height } = this.getGameDimensions();
    const text: string = `${SCORE_TEXT} ${String(ScoreboardScene.Score).padStart(SCORE_TEXT_PADDING, '0')}`;
    const x = width / 2 - (text.length * SCOREBOARD_TEXT_SIZE) / 2;
    this.scoreSprite = this.add.bitmapText(x, height - SCOREBOARD_Y * 1.5, FONT, text, SCOREBOARD_TEXT_SIZE).setTint(Colors.Green);
  }

  private blinkYourScore(delta: number) {
    if (!this.scoreSprite) {
      return;
    }

    this.scoreBlinkTimer -= delta;

    if (this.scoreBlinkTimer < 0) {
      this.scoreSprite.setAlpha(this.scoreSprite.alpha === 1 ? 0 : 1); // Toggle alpha
      this.scoreBlinkTimer = BLINK_TIME; // Restart timer
    }
  }
}

function isEnter(event: KeyboardEvent): boolean {
  return event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER;
}

function isSpace(event: KeyboardEvent): boolean {
  return event.keyCode === Phaser.Input.Keyboard.KeyCodes.SPACE;
}

function isLetter(event: KeyboardEvent): boolean {
  return event.keyCode >= Phaser.Input.Keyboard.KeyCodes.A && event.keyCode <= Phaser.Input.Keyboard.KeyCodes.Z;
}

function isNumber(event: KeyboardEvent): boolean {
  return (
    (event.keyCode >= Phaser.Input.Keyboard.KeyCodes.ZERO && event.keyCode <= Phaser.Input.Keyboard.KeyCodes.NINE) ||
    (event.keyCode >= Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO && event.keyCode <= Phaser.Input.Keyboard.KeyCodes.NUMPAD_NINE)
  );
}

function isBackspace(event: KeyboardEvent): boolean {
  return event.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE;
}
