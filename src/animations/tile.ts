import { SPRITES_KEY, TILES_KEY } from './sprites';

export enum TileAnimations {
  Brick = 'brickTile',
  Block = 'blockTile',
  Flag = 'flag',
}

// TODO: Use sprite animations instead of tileset

export const makeTileAnimations = (scene: Phaser.Scene) => {
  // Brick
  scene.anims.create({
    key: TileAnimations.Brick,
    frames: scene.anims.generateFrameNumbers(TILES_KEY, { start: 14, end: 14, first: 14 }),
  });

  // Block
  scene.anims.create({
    key: TileAnimations.Block,
    frames: scene.anims.generateFrameNumbers(TILES_KEY, { start: 43, end: 43, first: 43 }),
  });

  // Flag
  scene.anims.create({
    key: TileAnimations.Flag,
    frames: [{ key: SPRITES_KEY, frame: TileAnimations.Flag }],
    repeat: -1,
  });
};
