import { PowerUpAnimations } from '../animations';
import { Body, PlayerStates } from '../models';
import { GameScene } from '../scenes';

export const TILE_SIZE = 16; // TODO: Move to game config
export enum PowerUps {
  Coin = 'candy',
  Mushroom = 'mushroom',
  Flower = 'flower',
  Life = '1up',
  Star = 'star',
}

// Split in different classes

export class PowerUp extends Phaser.GameObjects.Sprite {
  static DIMENSIONS: Body = { width: 12, height: 12, x: 1.5, y: 4 };
  static VELOCITY_X = 70;
  static ACTIVATE_VELOCITY_Y = -150;
  static ANIMATION_DURATION = 500;
  static FLOWER_DEPTH = -100;
  static COIN_MOVEMENT_Y = 50;
  static STAR_VELOCITY_Y = -300;
  static POWER_UP_SCORE: number = 100;

  protected readonly currentScene: GameScene;
  private direction: number;
  type: PowerUps;

  constructor(config) {
    // TODO: Use interface
    super(config.scene, config.x, config.y, config.key);

    this.currentScene = config.scene;
    config.scene.physics.world.enable(this);
    config.scene.add.existing(this);

    this.init(config.type, config.x);
    this.activate();
  }

  private init(type: PowerUps, x: number) {
    this.type = type;

    if (this.currentScene.mario.x < x + TILE_SIZE / 2) {
      this.direction = PowerUp.VELOCITY_X; // Player on the right -> power up bounces right
    } else {
      this.direction = -PowerUp.VELOCITY_X; // Player on the right -> power up bounces left
    }
    this.body.velocity.x = this.direction;

    this.body.setSize(PowerUp.DIMENSIONS.width, PowerUp.DIMENSIONS.height);
    this.body.offset.set(PowerUp.DIMENSIONS.x, PowerUp.DIMENSIONS.y);
  }

  private activate() {
    if (this.type === PowerUps.Mushroom && this.currentScene.mario.playerState !== PlayerStates.Default) {
      this.type = PowerUps.Flower;
    }

    // Configure power up depending on type
    switch (this.type) {
      case PowerUps.Mushroom:
      case PowerUps.Life:
        this.body.velocity.y = -PowerUp.ACTIVATE_VELOCITY_Y;
        break;

      case PowerUps.Flower:
        this.setDepth(PowerUp.FLOWER_DEPTH);
        this.body.allowGravity = false;
        this.body.setVelocity(0, 0);
        this.direction = 0;
        this.y += TILE_SIZE;
        this.currentScene.tweens.add({
          targets: this,
          y: this.y - TILE_SIZE,
          duration: PowerUp.ANIMATION_DURATION,
        });
        break;

      case PowerUps.Coin:
        this.body.setVelocity(0, 0);
        this.body.allowGravity = false;
        this.currentScene.tweens.add({
          targets: this,
          y: this.y - PowerUp.COIN_MOVEMENT_Y,
          duration: PowerUp.ANIMATION_DURATION,
          onComplete: () => this.destroy(),
        });
        break;
    }

    // Play sounds
    switch (this.type) {
      case PowerUps.Coin:
        this.currentScene.sound.playAudioSprite('sfx', 'smb_coin'); // TODO: Refactor
        break;
      default:
        this.currentScene.sound.playAudioSprite('sfx', 'smb_powerup_appears');
        this.currentScene.powerUps.add(this);
    }

    // Play animation
    switch (this.type) {
      case PowerUps.Coin:
        this.anims.play(PowerUpAnimations.Coin);
        break;
      case PowerUps.Mushroom:
        this.anims.play(PowerUpAnimations.Mushroom);
        break;
      case PowerUps.Flower:
        this.anims.play(PowerUpAnimations.Flower);
        break;
      case PowerUps.Life:
        this.anims.play(PowerUpAnimations.Life);
        break;
      case PowerUps.Star:
        this.anims.play(PowerUpAnimations.Star);
        break;
    }
  }

  update() {
    // Check if power up needs to be destroyed
    if (this.alpha === 0) {
      this.currentScene.powerUps.remove(this);
      this.destroy();
      return;
    }

    if (!this.body) {
      return;
    }

    this.currentScene.physics.world.collide(this, this.currentScene.groundLayer);
    this.currentScene.physics.world.overlap(this, this.currentScene.mario, () => this.collected());

    // Invert direction
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.velocity.x = this.direction;
    }

    // Bounce
    if (this.type === PowerUps.Star) {
      if (this.body.blocked.down) {
        this.body.velocity.y = PowerUp.STAR_VELOCITY_Y;
      }
    }
  }

  private collected() {
    if (this.type === PowerUps.Flower && this.currentScene.mario.playerState === PlayerStates.Default) {
      this.type = PowerUps.Mushroom;
    }

    switch (this.type) {
      case PowerUps.Flower:
        this.currentScene.mario.playerState = PlayerStates.Fire;
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup'); // TODO: Refactor
        break;
      case PowerUps.Mushroom:
        // Power up will not be removed until next loop after physics is running again
        // (physics is paused by this.currentScene.mario.resize), until then we'll just hide it.
        this.currentScene.mario.resize(true);
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup');
        break;
      case PowerUps.Star:
        this.currentScene.mario.activateStar();
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup');
        break;
      case PowerUps.Life:
        this.scene.sound.playAudioSprite('sfx', 'smb_1-up');
        break;
    }

    // Get points
    this.currentScene.updateScore(PowerUp.POWER_UP_SCORE);
    this.alpha = 0;
  }
}
