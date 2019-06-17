import { SPRITES_KEY } from '@game/animations';
import { TILE_SIZE } from '@game/config';
import { Body, PlayerStates, Scores, Sounds } from '@game/models';
import { GameScene } from '@game/scenes';

export abstract class PowerUp extends Phaser.GameObjects.Sprite {
  static readonly VELOCITY_X = 140;
  static readonly ACTIVATE_VELOCITY_Y = -300;
  static readonly ANIMATION_DURATION = 500;

  body: Phaser.Physics.Arcade.Body;

  constructor(public scene: GameScene, x: number, y: number, public direction: number, public dimensions: Body) {
    super(scene, x, y, SPRITES_KEY);

    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.init(x);
    this.updateBody();
    this.activate();
  }

  private init(x: number) {
    if (!this.direction) {
      return;
    }

    if (this.scene.player.x > x + TILE_SIZE / 2) {
      this.direction = -this.direction; // Player on the right -> power up bounces left
    }

    this.body.setVelocityX(this.direction);
  }

  protected updateBody() {
    this.body.setSize(this.dimensions.width, this.dimensions.height);
    this.body.offset.set(this.dimensions.x, this.dimensions.y);
  }

  protected abstract activate();

  update() {
    // Check if power up needs to be destroyed
    const { height } = this.scene.getGameDimensions();
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
      this.body.setVelocityX(this.direction);
      this.setFlipX(this.direction < 0);
    }
  }

  protected collect() {
    // Get points
    this.scene.hud.updateScore(Scores.PowerUp, this.body.x, this.body.y);
    this.setAlpha(0);
  }

  protected upgradePlayer() {
    switch (this.scene.player.playerState) {
      case PlayerStates.Default:
        this.scene.soundEffects.playEffect(Sounds.PowerUp);
        this.scene.player.resize(true); // Grow
        break;
      case PlayerStates.Big:
        this.scene.soundEffects.playEffect(Sounds.PowerUp);
        this.scene.player.playerState = PlayerStates.Super; // Go super
        break;
      case PlayerStates.Super:
        this.scene.soundEffects.playEffect(Sounds.Life);
        this.scene.hud.updateLives(1); // get life
        break;
    }
  }
}
