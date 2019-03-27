import { SPRITES_KEY } from './sprites';

export enum TitleAnimations {
  Title = 'title',
}

export const makeTitleAnimations = (scene: Phaser.Scene) => {
  scene.anims.create({
    key: TitleAnimations.Title,
    frames: [{ frame: TitleAnimations.Title, key: SPRITES_KEY }],
  });
};
