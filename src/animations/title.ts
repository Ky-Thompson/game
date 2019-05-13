import { SPRITES_KEY } from './sprites';

export enum TitleAnimations {
  Title = 'title',
  Player = 'player',
  Exit = 'exit',
  Profile = 'profile',
}

export const makeTitleAnimations = (scene: Phaser.Scene) => {
  scene.anims.create({
    key: TitleAnimations.Title,
    frames: [{ frame: TitleAnimations.Title, key: SPRITES_KEY }],
  });

  scene.anims.create({
    key: TitleAnimations.Player,
    frames: [{ frame: TitleAnimations.Player, key: SPRITES_KEY }],
  });

  scene.anims.create({
    key: TitleAnimations.Exit,
    frames: [{ frame: TitleAnimations.Exit, key: SPRITES_KEY }],
  });

  scene.anims.create({
    key: TitleAnimations.Profile,
    frames: [{ frame: TitleAnimations.Profile, key: SPRITES_KEY }],
  });
};
