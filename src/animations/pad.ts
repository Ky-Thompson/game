import { SPRITES_KEY } from './sprites';

export enum PadAnimations {
  Up = 'pad/up',
  Down = 'pad/down',
  Right = 'pad/right',
  Left = 'pad/left',
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
