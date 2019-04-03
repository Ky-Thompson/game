import { SPRITES_KEY } from './sprites';

export enum PowerUpAnimations {
  Candy = 'candy/spin',
  Mushroom = 'powerup/mushroom',
  Flower = 'powerup/flower',
  Life = 'powerup/1up',
  Butterfly = 'powerup/butterfly',
}

export const makePowerUpAnimations = (scene: Phaser.Scene) => {
  // Coin
  scene.anims.create({
    key: PowerUpAnimations.Candy,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: PowerUpAnimations.Candy, start: 1, end: 4 }),
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

  // Butterfly
  scene.anims.create({
    key: PowerUpAnimations.Butterfly,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: PowerUpAnimations.Butterfly, start: 1, end: 4 }),
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
