import { PowerUpAnimations, SPRITES_KEY } from '../animations';
import { TILE_SIZE } from '../config';
import { Body, PlayerStates } from '../models';
import { GameScene } from '../scenes';

export enum PowerUps {
  Coin = 'candy',
  Mushroom = 'mushroom',
  Flower = 'flower',
  Life = '1up',
  Star = 'star',
}

const DIMENSIONS: Body = { width: 24, height: 24, x: 3, y: 8 };
const VELOCITY_X = 140;
const ACTIVATE_VELOCITY_Y = -300;
const ANIMATION_DURATION = 500;
const FLOWER_DEPTH = -100;
const COIN_MOVEMENT_Y = 100;
const STAR_VELOCITY_Y = -600;
const POWER_UP_SCORE: number = 100; // TODO: Move somewhere else

// TODO: Split in different classes or simplify

export class PowerUp extends Phaser.GameObjects.Sprite {
  private direction: number;

  constructor(public scene: GameScene, x: number, y: number, public type: PowerUps) {
    super(scene, x, y, SPRITES_KEY);

    scene.physics.world.enable(this);
    scene.add.existing(this);

    if (this.scene.player.x < x + TILE_SIZE / 2) {
      this.direction = VELOCITY_X; // Player on the right -> power up bounces right
    } else {
      this.direction = -VELOCITY_X; // Player on the right -> power up bounces left
    }
    this.body.velocity.x = this.direction;

    this.body.setSize(DIMENSIONS.width, DIMENSIONS.height);
    this.body.offset.set(DIMENSIONS.x, DIMENSIONS.y);

    this.activate();
  }

  private activate() {
    if (this.type === PowerUps.Mushroom && !this.scene.player.isPlayerState(PlayerStates.Default)) {
      this.type = PowerUps.Flower;
    }

    // Configure power up depending on type
    switch (this.type) {
      case PowerUps.Mushroom:
      case PowerUps.Life:
        this.body.velocity.y = -ACTIVATE_VELOCITY_Y;
        break;

      case PowerUps.Flower:
        this.setDepth(FLOWER_DEPTH);
        this.body.allowGravity = false;
        this.body.setVelocity(0, 0);
        this.direction = 0;
        this.y += TILE_SIZE;
        this.scene.tweens.add({
          targets: this,
          y: this.y - TILE_SIZE,
          duration: ANIMATION_DURATION,
        });
        break;

      case PowerUps.Coin:
        this.body.setVelocity(0, 0);
        this.body.allowGravity = false;
        this.scene.tweens.add({
          targets: this,
          y: this.y - COIN_MOVEMENT_Y,
          duration: ANIMATION_DURATION,
          onComplete: () => this.destroy(),
        });
        break;
    }

    // Play sounds
    switch (this.type) {
      case PowerUps.Coin:
        this.scene.sound.playAudioSprite('sfx', 'smb_coin'); // TODO: Refactor
        break;
      default:
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup_appears');
        this.scene.powerUps.add(this);
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
      this.scene.powerUps.remove(this);
      this.destroy();
      return;
    }

    if (!this.body) {
      return;
    }

    this.scene.world.collide(this);
    this.scene.physics.world.overlap(this, this.scene.player, () => this.collected());

    // Invert direction
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.velocity.x = this.direction;
    }

    // Bounce
    if (this.type === PowerUps.Star) {
      if (this.body.blocked.down) {
        this.body.velocity.y = STAR_VELOCITY_Y;
      }
    }
  }

  private collected() {
    if (this.type === PowerUps.Flower && this.scene.player.isPlayerState(PlayerStates.Default)) {
      this.type = PowerUps.Mushroom;
    }

    switch (this.type) {
      case PowerUps.Flower:
        this.scene.player.setPlayerState(PlayerStates.Fire);
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup'); // TODO: Refactor
        break;
      case PowerUps.Mushroom:
        // Power up will not be removed until next loop after physics is running again
        // (physics is paused by this.scene.mario.resize), until then we'll just hide it.
        this.scene.player.resize(true);
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup');
        break;
      case PowerUps.Star:
        this.scene.player.activateStar();
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup');
        break;
      case PowerUps.Life:
        this.scene.sound.playAudioSprite('sfx', 'smb_1-up');
        break;
    }

    // Get points
    this.scene.hud.updateScore(POWER_UP_SCORE);
    this.alpha = 0;
  }
}
