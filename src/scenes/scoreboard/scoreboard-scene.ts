import { getPlayerAnimationKey, SPRITES_KEY } from '@game/animations';
import { FONT, MS_TO_S, TILE_SIZE } from '@game/config';
import { FirebaseScore, listScores } from '@game/firebase';
import { Colors, GameOptions, PlayerActions, PlayerStates } from '@game/models';

import { BaseScene } from '../base';
import { GameScene } from '../game';
import { TitleScene } from '../title';

const SCOREBOARD_TIMEOUT = 100 * MS_TO_S;

const SCOREBOARD_Y = TILE_SIZE;
const SCOREBOARD_BACKGROUND_ALPHA = 0.8;
const SCOREBOARD_TEXT = 'SCOREBOARD';
const SCOREBOARD_TEXT_SIZE = TILE_SIZE;

const MAX_SCORES = 8;
const SCORES_TEXT_SIZE = TILE_SIZE;
const SCORES_X = TILE_SIZE * 2;
const SCORES_BASE_Y = TILE_SIZE * 3;
const SCORES_PADDING = TILE_SIZE / 4;
const NUMBER_TEXT_PADDING = 3;
const NAME_TEXT_PADDING = 9;
const SCORE_TEXT_PADDING = 5;
const PLAYER_Y = 12;

const YOUR_SCORE_TEXT = 'YOUR SCORE';
const YOUR_SCORE_BLINK_TIME = 500;

export class ScoreboardScene extends BaseScene {
  static readonly SceneKey = 'ScoreboardScene';

  private static Scores: FirebaseScore[] = [];
  private static LastScore: number = 0;

  static async LoadScores(refresh?: boolean) {
    if (refresh || !ScoreboardScene.Scores.length) {
      ScoreboardScene.Scores = await listScores();
    }
  }

  static SetLastScore(score: number) {
    ScoreboardScene.LastScore = score;
  }

  private yourScoreSprite: Phaser.GameObjects.BitmapText;
  private blinkTimer: number = YOUR_SCORE_BLINK_TIME * 2;
  private timeout: number = 0;

  constructor() {
    super({ key: ScoreboardScene.SceneKey });
  }

  async create() {
    await ScoreboardScene.LoadScores();
    this.initScene();
    this.initTitle();
    this.initScores();
    this.initYourScore();

    this.input.on('pointerdown', () => this.scene.start(TitleScene.SceneKey));
  }

  update(time: number, delta: number) {
    this.blinkYourScore(delta);

    this.timeout += delta;

    if (this.timeout > SCOREBOARD_TIMEOUT) {
      this.scene.start(TitleScene.SceneKey);
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

  // Methods for the title

  private initTitle() {
    const { width } = this.getGameDimensions();
    const x: number = width / 2 - (SCOREBOARD_TEXT.length * SCOREBOARD_TEXT_SIZE) / 2;
    this.add.bitmapText(x, SCOREBOARD_Y, FONT, SCOREBOARD_TEXT, SCOREBOARD_TEXT_SIZE).setTint(Colors.Red);
  }

  // Methods for the score list

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

  // Methods for your score

  private initYourScore() {
    const { width, height } = this.getGameDimensions();
    const text: string = `${YOUR_SCORE_TEXT} ${String(ScoreboardScene.LastScore).padStart(SCORE_TEXT_PADDING, '0')}`;
    const x = width / 2 - (text.length * SCOREBOARD_TEXT_SIZE) / 2;
    this.yourScoreSprite = this.add.bitmapText(x, height - SCOREBOARD_Y * 1.5, FONT, text, SCOREBOARD_TEXT_SIZE).setTint(Colors.Green);
  }

  private blinkYourScore(delta: number) {
    this.blinkTimer -= delta;

    if (this.blinkTimer < 0) {
      this.yourScoreSprite.setAlpha(this.yourScoreSprite.alpha === 1 ? 0 : 1); // Toggle alpha
      this.blinkTimer = YOUR_SCORE_BLINK_TIME; // Restart timer
    }
  }
}
