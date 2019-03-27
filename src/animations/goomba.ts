import { SPRITES_KEY } from './sprites';

export enum GoombaAnimations {
  Default = 'liar/walk',
  Flattened = 'liar/flat',
}

export const makeGoombaAnimations = (scene: Phaser.Scene) => {
  // Walk
  scene.anims.create({
    key: GoombaAnimations.Default,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: GoombaAnimations.Default, start: 1, end: 2 }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  });

  // Flat
  scene.anims.create({
    key: GoombaAnimations.Flattened,
    frames: [{ key: SPRITES_KEY, frame: GoombaAnimations.Flattened }],
  });
};
