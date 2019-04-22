import { SPRITES_KEY } from './sprites';

export enum PadAnimations {
  Default = 'pad/default',
  Up = 'pad/up',
  Down = 'pad/down',
  Right = 'pad/right',
  RightUp = 'pad/right-up',
  RightDown = 'pad/right-down',
  Left = 'pad/left',
  LeftUp = 'pad/left-up',
  LeftDown = 'pad/left-down',
  A = 'pad/a',
}

export const makePadAnimations = (scene: Phaser.Scene) => {
  for (const animation in PadAnimations) {
    scene.anims.create({
      key: PadAnimations[animation],
      frames: [{ key: SPRITES_KEY, frame: PadAnimations[animation] }],
    });
  }
};
