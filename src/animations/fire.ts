import { SPRITES_KEY } from './sprites';

export enum FireAnimations {
  Fly = 'fire/fly',
  Explode = 'fire/explode',
}

export const makeFireAnimations = (scene: Phaser.Scene) => {
  // Fly
  scene.anims.create({
    key: FireAnimations.Fly,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: FireAnimations.Fly, start: 1, end: 4 }),
    frameRate: 10,
    repeat: -1,
    repeatDelay: 0,
  });

  // Explode
  scene.anims.create({
    key: FireAnimations.Explode,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: FireAnimations.Explode, start: 1, end: 3 }),
    frameRate: 30,
    repeat: 0,
    repeatDelay: 0,
  });
};
