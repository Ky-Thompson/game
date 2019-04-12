import { SPRITES_KEY } from './sprites';

export enum HUDAnimations {
  Life = 'heart',
}

export const makeHUDAnimations = (scene: Phaser.Scene) => {
  scene.anims.create({
    key: HUDAnimations.Life,
    frames: [{ frame: HUDAnimations.Life, key: SPRITES_KEY }],
  });
};
