import { PlayerActions, Players, PlayerStates } from '@game/models';

import { SPRITES_KEY } from './sprites';

export const getPlayerAnimationKey = (
  player: Players,
  playerAction: PlayerActions,
  playerState: PlayerStates = PlayerStates.Default
): string => {
  if (playerAction === PlayerActions.Death) {
    playerState = PlayerStates.Default; // Death only is in default state
  }

  return `${player}/${playerAction}${playerState}`;
};

export const makePlayerAnimations = (scene: Phaser.Scene, player: Players) => {
  // Common properties for all animations
  const frameRate: Partial<Phaser.Animations.Types.Animation> = {
    frameRate: 10,
    repeat: -1,
    repeatDelay: 0,
  };

  // Loop in Default, Big and Fire
  for (const playerState in PlayerStates) {
    const state: PlayerStates = <PlayerStates>PlayerStates[playerState];

    // Walk action animation
    const walkKey: string = getPlayerAnimationKey(player, PlayerActions.Walk, state);
    scene.anims.create({
      key: walkKey,
      frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: walkKey, start: 1, end: 3 }),
      ...frameRate,
    });

    // Jump, Stand, Turn and bend actions animation: one frame each
    const movementActions: PlayerActions[] = [PlayerActions.Stand, PlayerActions.Jump, PlayerActions.Turn, PlayerActions.Bend];
    movementActions.forEach((action: PlayerActions) => {
      // No bend animation when Player is small
      if (action === PlayerActions.Bend && state === PlayerStates.Default) {
        return;
      }

      const key: string = getPlayerAnimationKey(player, action, state);
      scene.anims.create({
        key: key,
        frames: [{ frame: key, key: SPRITES_KEY }],
      });
    });

    // Climb action animation
    const climbKey: string = getPlayerAnimationKey(player, PlayerActions.Climb, state);
    scene.anims.create({
      key: climbKey,
      frames: scene.anims.generateFrameNames(SPRITES_KEY, { prefix: climbKey, start: 1, end: 2 }),
      frameRate: 5,
      repeat: -1,
      repeatDelay: 0,
    });
  }

  // Death action animation
  const deathKey: string = getPlayerAnimationKey(player, PlayerActions.Death);
  scene.anims.create({
    key: deathKey,
    frames: [{ frame: deathKey, key: SPRITES_KEY }],
  });

  // Grow and shrink
  const growFrames: string[] = [
    getPlayerAnimationKey(player, PlayerActions.Half),
    getPlayerAnimationKey(player, PlayerActions.Stand),
    getPlayerAnimationKey(player, PlayerActions.Half),
    getPlayerAnimationKey(player, PlayerActions.Stand, PlayerStates.Big),
    getPlayerAnimationKey(player, PlayerActions.Half),
    getPlayerAnimationKey(player, PlayerActions.Stand, PlayerStates.Big),
  ];
  const frames: Phaser.Animations.Types.AnimationFrame[] = growFrames.map((frame) => ({ frame, key: SPRITES_KEY }));

  const growKey: string = getPlayerAnimationKey(player, PlayerActions.Grow);
  scene.anims.create({
    key: growKey,
    frames: frames,
    frameRate: 10,
    repeat: 0,
    repeatDelay: 0,
  });

  const shrinkKey: string = getPlayerAnimationKey(player, PlayerActions.Shrink);
  scene.anims.create({
    key: shrinkKey,
    frames: frames.reverse(),
    frameRate: 10,
    repeat: 0,
    repeatDelay: 0,
  });
};
