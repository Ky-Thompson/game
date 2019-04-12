import { SPRITES_KEY } from './sprites';

export enum LiarAnimations {
  Default = 'liar/walk',
  Flattened = 'liar/flat',
}

export const makeLiarAnimations = (scene: Phaser.Scene) => {
  // Walk
  scene.anims.create({
    key: LiarAnimations.Default,
    frames: [{ key: SPRITES_KEY, frame: LiarAnimations.Default }],
  });

  // Flat
  scene.anims.create({
    key: LiarAnimations.Flattened,
    frames: [{ key: SPRITES_KEY, frame: LiarAnimations.Flattened }],
  });
};
