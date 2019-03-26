export enum PadAnimations {
  Up = 'pad/up',
  Down = 'pad/down',
  Right = 'pad/right',
  Left = 'pad/left',
  A = 'pad/a',
}

const makePadAnimations = (scene: Phaser.Scene) => {
  for (const padAnimation in PadAnimations) {
    const config: AnimationConfig = {
      key: PadAnimations[padAnimation],
      frames: [{ key: 'mario-sprites', frame: PadAnimations[padAnimation] }],
    };
    scene.anims.create(config);
  }
};

const makePlayerAnimations = (scene, player) => {
  let config: any;

  // Mario animations: One without suffix, super after mushroom and fire after flower
  ['', 'Super', 'Fire'].forEach((suffix) => {
    config = {
      key: player + '/run' + suffix,
      frames: scene.anims.generateFrameNames('mario-sprites', {
        prefix: player + '/walk' + suffix,
        start: 1,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
      repeatDelay: 0,
    };
    scene.anims.create(config);

    // Jump, Stand and Turn: one frame each
    ['jump', 'stand', 'turn', 'bend'].forEach((anim) => {
      if (anim === 'bend' && suffix === '') {
        // No bend animation when Mario is small
        return;
      }
      config.key = player + '/' + anim + suffix;
      config.frames = [
        {
          frame: player + '/' + anim + suffix,
          key: 'mario-sprites',
        },
      ];
      scene.anims.create(config);
    });

    // Climb
    config.key = player + '/climb' + suffix;
    config.frames = scene.anims.generateFrameNames('mario-sprites', {
      prefix: player + '/climb' + suffix,
      start: 1,
      end: 2,
    });
    scene.anims.create(config);

    // Swim
    config.key = player + '/swim' + suffix;
    config.frames = scene.anims.generateFrameNames('mario-sprites', {
      prefix: player + '/swim' + suffix,
      start: 1,
      end: 6,
    });
    scene.anims.create(config);
  });

  config.key = player + '/death';
  config.frames = [
    {
      frame: player + '/dead',
      key: 'mario-sprites',
    },
  ];
  scene.anims.create(config);
};

export function makeAnimations(scene) {
  makePadAnimations(scene);

  // TONS of animations. Everything animation-related is ugly and stupid below.
  // TODO:  maybe use JSON to load animations
  let config: any;
  config = {
    key: 'brickTile',
    frames: scene.anims.generateFrameNumbers('tiles', {
      start: 14,
      end: 14,
      first: 14,
    }),
  };
  scene.anims.create(config);
  config = {
    key: 'blockTile',
    frames: scene.anims.generateFrameNumbers('tiles', {
      start: 43,
      end: 43,
      first: 43,
    }),
  };
  scene.anims.create(config);

  // Didn't find a good way to create an animation with frame names without a pattern.
  let frames = [];
  ['mario/half', 'mario/stand', 'mario/half', 'mario/standSuper', 'mario/half', 'mario/standSuper'].forEach((frame) => {
    frames.push({
      frame,
      key: 'mario-sprites',
    });
  });
  config = {
    key: 'grow',
    frames: frames,
    frameRate: 10,
    repeat: 0,
    repeatDelay: 0,
  };
  scene.anims.create(config);
  config = {
    key: 'shrink',
    frames: frames.reverse(),
    frameRate: 10,
    repeat: 0,
    repeatDelay: 0,
  };
  scene.anims.create(config);

  // ALL MARIO ANIMATIONS DONE
  makePlayerAnimations(scene, 'mario');
  makePlayerAnimations(scene, 'caleb');
  makePlayerAnimations(scene, 'sophia');

  config = {
    key: 'goomba',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'goomba/walk',
      start: 1,
      end: 2,
    }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);
  config = {
    key: 'goombaFlat',
    frames: [
      {
        key: 'mario-sprites',
        frame: 'goomba/flat',
      },
    ],
  };
  scene.anims.create(config);

  config = {
    key: 'liar',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'liar/walk',
      start: 1,
      end: 2,
    }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);
  config = {
    key: 'liarFlat',
    frames: [
      {
        key: 'mario-sprites',
        frame: 'liar/flat',
      },
    ],
  };
  scene.anims.create(config);

  config = {
    key: 'turtle',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'turtle/turtle',
      end: 1,
    }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  };

  scene.anims.create(config);
  config = {
    key: 'mario/climb',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'mario/climb',
      end: 1,
    }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);
  config = {
    key: 'mario/climbSuper',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'mario/climbSuper',
      end: 1,
    }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 0,
  };

  scene.anims.create(config);

  config = {
    key: 'flag',
    frames: [
      {
        key: 'mario-sprites',
        frame: 'flag',
      },
    ],
    repeat: -1,
  };
  scene.anims.create(config);

  config = {
    key: 'turtleShell',
    frames: [
      {
        frame: 'turtle/shell',
        key: 'mario-sprites',
      },
    ],
  };

  scene.anims.create(config);

  config = {
    key: 'mushroom',
    frames: [
      {
        frame: 'powerup/super',
        key: 'mario-sprites',
      },
    ],
  };
  scene.anims.create(config);

  config = {
    key: 'coin',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'coin/spin',
      start: 1,
      end: 4,
    }),
    frameRate: 20,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);

  config = {
    key: 'candy',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'candy/spin',
      start: 1,
      end: 4,
    }),
    frameRate: 20,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);

  config = {
    key: '1up',
    frames: [
      {
        frame: 'powerup/1up',
        key: 'mario-sprites',
      },
    ],
  };
  scene.anims.create(config);

  config = {
    key: 'flower',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'powerup/flower',
      start: 1,
      end: 4,
    }),
    frameRate: 30,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);

  config = {
    key: 'star',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'powerup/star',
      start: 1,
      end: 4,
    }),
    frameRate: 30,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);

  config = {
    key: 'fireFly',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'fire/fly',
      start: 1,
      end: 4,
    }),
    frameRate: 10,
    repeat: -1,
    repeatDelay: 0,
  };
  scene.anims.create(config);

  config = {
    key: 'fireExplode',
    frames: scene.anims.generateFrameNames('mario-sprites', {
      prefix: 'fire/explode',
      start: 1,
      end: 3,
    }),
    frameRate: 30,
    repeat: 0,
    repeatDelay: 0,
  };

  scene.anims.create(config);
}
