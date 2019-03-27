import { SPRITES_KEY } from './sprites';

export enum TurtleAnimations {
  Default = 'turtle/turtle',
  Shell = 'turtle/shell',
}

export const makeTurtleAnimations = (scene: Phaser.Scene) => {
  // Walk
  scene.anims.create({
    key: TurtleAnimations.Default,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: TurtleAnimations.Default, start: 1, end: 2 }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  });

  // Shell
  scene.anims.create({
    key: TurtleAnimations.Shell,
    frames: [{ key: SPRITES_KEY, frame: TurtleAnimations.Shell }],
  });
};
