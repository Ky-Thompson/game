import { Tilemap, TilemapIds } from '@game/models';

import { SPRITES_KEY } from './sprites';

export enum TileAnimations {
  Brick = 'brickTile',
  Block = 'blockTile',
  Flag = 'flag',
}

export const makeTileAnimations = (scene: Phaser.Scene) => {
  // Brick
  scene.anims.create({
    key: TileAnimations.Brick,
    frames: scene.anims.generateFrameNumbers(Tilemap.TilesetKey, {
      start: TilemapIds.BrickTile,
      end: TilemapIds.BrickTile,
    }),
  });

  // Block
  scene.anims.create({
    key: TileAnimations.Block,
    frames: scene.anims.generateFrameNumbers(Tilemap.TilesetKey, {
      start: TilemapIds.BlockTile,
      end: TilemapIds.BlockTile,
    }),
  });

  // Flag
  scene.anims.create({
    key: TileAnimations.Flag,
    frames: [{ key: SPRITES_KEY, frame: TileAnimations.Flag }],
    repeat: -1,
  });
};
