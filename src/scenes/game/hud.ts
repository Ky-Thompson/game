import { HUDAnimations, SPRITES_KEY } from '@game/animations';
import { FONT, GAME_TIMEOUT, HURRY_TIME, MS_TO_S, TILE_SIZE, TIME_FACTOR } from '@game/config';
import { Colors, Depths, Scores, Sounds } from '@game/models';

import { GameScene } from './game-scene';

const FONT_SIZE = TILE_SIZE / 2;
const HUD_PADDING = TILE_SIZE * 2;
const SCORE_TEXT_PADDING = 5;
const SCORE_POP_TEXT_SIZE = TILE_SIZE / 3;
const SCORE_POP_Y = TILE_SIZE;
const SCORE_POP_DURATION = 800;
const SCORE_POP_ALPHA = 0.8;
const SCORE_POP_EASE = 'Quad.easeOut';
const TIME_TEXT_PADDING = 3;
const TIME_TEXT = 'TIME';
const LIFES_Y = (TILE_SIZE * 3) / 4;
const MAX_LIFES = 5;
const START_LIFES = 3;

export class HUD {
  private playerText: Phaser.GameObjects.BitmapText;
  private scoreText: Phaser.GameObjects.BitmapText;
  private score: number = 0;

  private timeText: Phaser.GameObjects.BitmapText;
  private timerText: Phaser.GameObjects.BitmapText;
  private time: number = GAME_TIMEOUT * MS_TO_S;
  private displayedTime: number = GAME_TIMEOUT;
  private hurry: boolean = false;

  private readonly lifeSprites: Phaser.GameObjects.Sprite[] = [];
  private lifes: number = START_LIFES;
  private scoreboardActive: boolean = false;

  constructor(private scene: GameScene) {
    this.initPlayerScore();
    this.initTimer();
    this.initLifes();

    this.scoreboardActive = this.scene.isScoreboardActive();

    if (this.scene.demo.isActive() || this.scoreboardActive) {
      this.playerText.setAlpha(0);
      this.scoreText.setAlpha(0);
      this.timeText.setAlpha(0);
      this.timerText.setAlpha(0);
      this.lifeSprites.forEach((life) => life.setAlpha(0).setActive(false));
    }
  }

  private initPlayerScore() {
    this.playerText = this.scene.add
      .bitmapText(HUD_PADDING, TILE_SIZE / 2, FONT, this.scene.player.getPlayerType().toUpperCase(), FONT_SIZE)
      .setScrollFactor(0, 0);

    this.scoreText = this.scene.add
      .bitmapText(HUD_PADDING, TILE_SIZE, FONT, ''.padEnd(SCORE_TEXT_PADDING, '0'), FONT_SIZE)
      .setScrollFactor(0, 0);
  }

  private initTimer() {
    const { width } = this.scene.getGameDimensions();
    const timePosition = width - HUD_PADDING;

    this.timeText = this.scene.add
      .bitmapText(timePosition - TIME_TEXT.length * FONT_SIZE, TILE_SIZE / 2, FONT, TIME_TEXT, FONT_SIZE)
      .setScrollFactor(0, 0);

    this.timerText = this.scene.add
      .bitmapText(timePosition - TIME_TEXT_PADDING * FONT_SIZE, TILE_SIZE, FONT, ''.padEnd(TIME_TEXT_PADDING, '0'), FONT_SIZE)
      .setScrollFactor(0, 0);

    this.time = GAME_TIMEOUT * MS_TO_S;
    this.displayedTime = GAME_TIMEOUT;
  }

  private initLifes() {
    const lifesX = HUD_PADDING + this.scene.player.getPlayerType().toUpperCase().length * FONT_SIZE + TILE_SIZE / 2;

    for (let i = 0; i < MAX_LIFES; i++) {
      const sprite = this.scene.add
        .sprite(lifesX + (TILE_SIZE * i) / 2, LIFES_Y, SPRITES_KEY)
        .play(HUDAnimations.Life)
        .setActive(false)
        .setScrollFactor(0, 0);

      this.lifeSprites.push(sprite);
    }

    this.updateLifes(0);
  }

  updateLifes(inc: number): boolean {
    this.lifes += inc;
    this.lifes = Math.max(Math.min(this.lifes, MAX_LIFES), 0);
    this.lifeSprites.forEach((life, index) => life.setAlpha(index < this.lifes ? 1 : 0));

    return this.lifes > 0;
  }

  update(delta: number) {
    if (this.displayedTime <= 0 || this.scene.finishLine.succeeded() || this.scoreboardActive) {
      return;
    }

    this.time -= delta * TIME_FACTOR;

    if (this.time / MS_TO_S - this.displayedTime < 1) {
      this.displayedTime = Math.round(this.time / MS_TO_S);
      this.timerText.setText(String(this.displayedTime).padStart(TIME_TEXT_PADDING, '0'));

      // Hurry up if there is little time left
      if (this.displayedTime < HURRY_TIME && !this.hurry && !this.scene.demo.isActive()) {
        this.hurry = true;
        this.scene.soundEffects.pauseMusic();
        this.scene.soundEffects.playEffect(Sounds.Warning, () => {
          this.scene.soundEffects.resumeMusic();
          this.scene.soundEffects.setMusicRate(1.5);
        });
      }

      if (this.hurry) {
        // Alternate colors each time
        if (this.displayedTime % 2) {
          this.timeText.setTint(Colors.Red);
          this.timerText.setTint(Colors.Red);
        } else {
          this.timeText.clearTint();
          this.timerText.clearTint();
        }
      }

      // Timeout
      if (this.hasTimedOut()) {
        this.scene.player.die();
        this.hurry = false;
        this.timerText.clearTint();
        this.scene.soundEffects.setMusicRate(1);
        this.time = 0;
        this.displayedTime = 0;
      }
    }
  }

  getScore(): number {
    return this.score;
  }

  updateScore(score: Scores, x: number, y: number) {
    // Update HUD score
    this.score += score;
    this.scoreText.setText(String(this.score).padStart(SCORE_TEXT_PADDING, '0'));

    y -= TILE_SIZE; // Start above element

    if (this.scene.demo.isActive()) {
      return;
    }

    // Show score
    const scoreText: Phaser.GameObjects.BitmapText = this.scene.add
      .bitmapText(x, y, FONT, String(score), SCORE_POP_TEXT_SIZE)
      .setDepth(Depths.HUD);

    this.scene.tweens.add({
      targets: scoreText,
      y: y - SCORE_POP_Y,
      alpha: SCORE_POP_ALPHA,
      duration: SCORE_POP_DURATION,
      ease: SCORE_POP_EASE,
      onComplete: () => scoreText.destroy(),
    });
  }

  hasTimedOut(): boolean {
    return this.displayedTime < 1;
  }
}
