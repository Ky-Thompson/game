import { SPRITES_KEY } from './sprites';

export enum CarAnimations {
  Default = 'car/car',
  Crushed = 'car/crushed',
}

export const makeCarAnimations = (scene: Phaser.Scene) => {
  // Default
  scene.anims.create({
    key: CarAnimations.Default,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: CarAnimations.Default, start: 1, end: 4 }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  });

  // Crushed
  scene.anims.create({
    key: CarAnimations.Crushed,
    frames: [{ key: SPRITES_KEY, frame: CarAnimations.Crushed }],
  });
};
