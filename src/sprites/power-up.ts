import { PowerUpAnimations, SPRITES_KEY } from '@game/animations';
import { TILE_SIZE } from '@game/config';
import { Body, PlayerStates, PowerUps, Scores, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

const DIMENSIONS: Body = { width: 24, height: 24, x: 3, y: 8 };
const VELOCITY_X = 140;
const ACTIVATE_VELOCITY_Y = -300;
const ANIMATION_DURATION = 500;
const FLOWER_DEPTH = -100;
const COIN_MOVEMENT_Y = 100;
const BUTTERFLY_VELOCITY_Y = -600;

const BUTTERFLY_DIMENSIONS: Body = { width: 32, height: 30, x: 0, y: 1 };

// TODO: Split in different classes or simplify

export class PowerUp extends Phaser.GameObjects.Sprite {
  private direction: number;
  body: Phaser.Physics.Arcade.Body;

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

    let dimensions: Body;

    switch (this.type) {
      case PowerUps.Butterfly:
        dimensions = BUTTERFLY_DIMENSIONS;
        break;
      default:
        dimensions = DIMENSIONS;
    }

    this.body.setSize(dimensions.width, dimensions.height);
    this.body.offset.set(dimensions.x, dimensions.y);

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
        this.body.velocity.y = ACTIVATE_VELOCITY_Y;
        break;

      case PowerUps.Butterfly:
        this.body.velocity.y = BUTTERFLY_VELOCITY_Y;
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

      case PowerUps.Candy:
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
      case PowerUps.Candy:
        this.scene.soundEffects.playEffect(Sounds.Candy);
        break;
      default:
        this.scene.soundEffects.playEffect(Sounds.PowerUpAppears);
        this.scene.powerUps.add(this);
    }

    // Play animation
    switch (this.type) {
      case PowerUps.Candy:
        this.anims.play(PowerUpAnimations.Candy);
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
      case PowerUps.Butterfly:
        this.anims.play(PowerUpAnimations.Butterfly);
        break;
    }
  }

  update() {
    // Check if power up needs to be destroyed
    const { height } = this.scene.gameConfig();
    if (this.alpha === 0 || this.y > height * 2) {
      this.scene.powerUps.remove(this);
      this.destroy();
      return;
    }

    if (!this.body) {
      return;
    }

    this.scene.world.collide(this);
    this.scene.physics.world.overlap(this, this.scene.player, () => this.collect());

    // Invert direction
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.velocity.x = this.direction;
    }

    // Bounce
    if (this.type === PowerUps.Butterfly) {
      if (this.body.blocked.down) {
        this.body.velocity.y = BUTTERFLY_VELOCITY_Y;
      }
    }
  }

  private collect() {
    if (this.type === PowerUps.Flower && this.scene.player.isPlayerState(PlayerStates.Default)) {
      this.type = PowerUps.Mushroom;
    }

    switch (this.type) {
      case PowerUps.Flower:
        this.scene.player.setPlayerState(PlayerStates.Super);
        this.scene.soundEffects.playEffect(Sounds.PowerUp);
        break;
      case PowerUps.Mushroom:
        // Power up will not be removed until next loop after physics is running again
        // (physics is paused by this.scene.player.resize), until then we'll just hide it.
        this.scene.player.resize(true);
        this.scene.soundEffects.playEffect(Sounds.PowerUp);
        break;
      case PowerUps.Butterfly:
        this.scene.player.activateStar();
        this.scene.soundEffects.playEffect(Sounds.PowerUp);
        break;
      case PowerUps.Life:
        this.scene.soundEffects.playEffect(Sounds.Life);
        break;
    }

    // Get points
    this.scene.hud.updateScore(Scores.PowerUp);
    this.alpha = 0;
  }
}
