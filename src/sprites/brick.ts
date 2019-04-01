import { TILE_SIZE } from '../config';
import { GameScene } from '../scenes';

export const BLOCK_TILE = 44; // Use properties

export enum BrickAnimations {
  Brick = 'brickTile',
  Block = 'blockTile',
}

// TODO: Rename file to bounce-brik
export class BounceBrick extends Phaser.GameObjects.Sprite {
  static HIDDEN_X = -200;
  static ANIMATION_DURATION = 100;
  protected readonly currentScene: GameScene;

  constructor(config) {
    super(config.scene, BounceBrick.HIDDEN_X, 0, 'tiles');

    this.currentScene = config.scene;
    config.scene.add.existing(this);
    config.scene.physics.world.enable(this);

    this.init();
  }

  private init() {
    this.alpha = 0;
    this.body.allowGravity = false;
    this.play(BrickAnimations.Brick);
  }

  update() {
    this.currentScene.enemies.overlapBrick(this);
  }

  restart(tile: Phaser.Tilemaps.Tile) {
    // Hide original tile and show this animation
    tile.alpha = 0;
    this.alpha = 1;

    // Play animation
    this.play(tile.index === BLOCK_TILE ? BrickAnimations.Block : BrickAnimations.Brick);

    this.x = tile.x * TILE_SIZE + TILE_SIZE / 2;
    this.y = tile.y * TILE_SIZE + TILE_SIZE / 2;

    // Bounce it
    this.currentScene.tweens.add({
      targets: this,
      y: this.y - TILE_SIZE / 2,
      yoyo: true,
      duration: BounceBrick.ANIMATION_DURATION,
      onUpdate: () => this.update(),
      onComplete: () => {
        // Reveal original tile and hide this animation
        tile.alpha = 1;
        this.alpha = 0;
        this.x = BounceBrick.HIDDEN_X;
      },
    });
  }
}
