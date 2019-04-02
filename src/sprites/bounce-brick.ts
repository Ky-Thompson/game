import { TILES_KEY } from '../animations';
import { TILE_SIZE } from '../config';
import { TiledGameObject } from '../models';
import { GameScene } from '../scenes';

const BLOCK_TILE = 44; // TODO: Use properties
const HIDDEN_X = -200;
const ANIMATION_DURATION = 100;

enum BrickAnimations {
  Brick = 'brickTile',
  Block = 'blockTile',
}

export class BounceBrick extends Phaser.GameObjects.Sprite {
  constructor(public scene: GameScene) {
    super(scene, HIDDEN_X, 0, TILES_KEY);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.alpha = 0;
    this.body.allowGravity = false;
    this.play(BrickAnimations.Brick);
  }

  update() {
    this.scene.enemies.overlapBrick(this);
  }

  restart(tile: TiledGameObject) {
    // Hide original tile and show this animation
    tile.alpha = 0;
    this.alpha = 1;

    // Play animation
    this.play(tile.index === BLOCK_TILE ? BrickAnimations.Block : BrickAnimations.Brick);

    this.x = tile.x * TILE_SIZE + TILE_SIZE / 2;
    this.y = tile.y * TILE_SIZE + TILE_SIZE / 2;

    // Bounce it
    this.scene.tweens.add({
      targets: this,
      y: this.y - TILE_SIZE / 2,
      yoyo: true,
      duration: ANIMATION_DURATION,
      onUpdate: () => this.update(),
      onComplete: () => {
        // Reveal original tile and hide this animation
        tile.alpha = 1;
        this.alpha = 0;
        this.x = HIDDEN_X;
      },
    });
  }
}
