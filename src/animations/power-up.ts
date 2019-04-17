import { SPRITES_KEY } from './sprites';

export enum PowerUpAnimations {
  Candy = 'candy',
  Bear = 'powerup/bear',
  Flower = 'powerup/flower',
  Robot = 'powerup/robot',
  Butterfly = 'powerup/butterfly',
}

export enum CandyColors {
  Red = 'red',
  Green = 'green',
  Yellow = 'yellow',
  Blue = 'blue',
  Orange = 'orange',
}

const CANDY_COLORS: CandyColors[] = Object.keys(CandyColors).map((color) => CandyColors[color]);

export const getCandyAnimationKey = (candyColor?: CandyColors): string => {
  if (!candyColor) {
    const randomColorIndex = Math.floor(Math.random() * CANDY_COLORS.length);
    candyColor = CANDY_COLORS[randomColorIndex];
  }

  return `${PowerUpAnimations.Candy}/${candyColor}`;
};

export const makePowerUpAnimations = (scene: Phaser.Scene) => {
  // Candy
  CANDY_COLORS.forEach((candyColor) => {
    const candyKey = getCandyAnimationKey(candyColor);

    scene.anims.create({
      key: candyKey,
      frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: candyKey, start: 1, end: 6 }),
      frameRate: 15,
      repeat: -1,
      repeatDelay: 0,
    });
  });

  // Bear and life
  scene.anims.create({
    key: PowerUpAnimations.Bear,
    frames: [{ frame: PowerUpAnimations.Bear, key: SPRITES_KEY }],
  });

  // Robot
  scene.anims.create({
    key: PowerUpAnimations.Robot,
    frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: PowerUpAnimations.Robot, start: 1, end: 3 }),
    frameRate: 10,
    repeat: -1,
    repeatDelay: 0,
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
