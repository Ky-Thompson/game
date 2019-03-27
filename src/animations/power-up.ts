import { SPRITES_KEY } from './sprites';

export enum PowerUpAnimations {
  Coin = 'candy/spin', // TODO: Rename coin by candy
  Mushroom = 'powerup/mushroom',
  Flower = 'powerup/flower',
  Life = 'powerup/1up',
  Star = 'powerup/star',
}

export const makePowerUpAnimations = (scene: Phaser.Scene) => {
  // Coin
  scene.anims.create({
    key: PowerUpAnimations.Coin,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: PowerUpAnimations.Coin, start: 1, end: 4 }),
    frameRate: 15,
    repeat: -1,
    repeatDelay: 0,
  });

  // Mushroom and life
  const staticPowerUps = [PowerUpAnimations.Life, PowerUpAnimations.Mushroom];
  staticPowerUps.forEach((animation) => {
    scene.anims.create({
      key: animation,
      frames: [{ frame: animation, key: SPRITES_KEY }],
    });
  });

  // Star
  scene.anims.create({
    key: PowerUpAnimations.Star,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: PowerUpAnimations.Star, start: 1, end: 4 }),
    frameRate: 30,
    repeat: -1,
    repeatDelay: 0,
  });

  // Flower
  scene.anims.create({
    key: PowerUpAnimations.Flower,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: PowerUpAnimations.Flower, start: 1, end: 4 }),
    frameRate: 30,
    repeat: -1,
    repeatDelay: 0,
  });
};
