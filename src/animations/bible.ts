import { SPRITES_KEY } from './sprites';

export enum BibleAnimations {
  Fly = 'bible/fly',
}

export const makeBibleAnimations = (scene: Phaser.Scene) => {
  scene.anims.create({
    key: BibleAnimations.Fly,
    frames: [{ key: SPRITES_KEY, frame: BibleAnimations.Fly }],
  });
};
