import { getPlayerAnimationKey } from '@game/animations';
import { ActionState, Body, Colors, PipeDirection, PlayerActions, Players, PlayerStates, Sounds, TiledGameObject } from '@game/models';
import { GameScene } from '@game/scenes';

import { Enemy } from './enemy';

const DEFAULT_BODY: Body = { width: 20, height: 20, x: 6, y: 12 };
const SUPER_BODY: Body = { width: 20, height: 44, x: 6, y: 20 };
const ACCELERATION = 1200;
const MIN_VELOCITY_X = 20;
const MIN_VELOCITY_Y = 30;
const MAX_VELOCITY_X = 400;
const MAX_VELOCITY_Y = 1000;
const JUMP_VELOCITY = -400;
const JUMP_TIME = 300;
const BEND_VELOCITY = 200;
const FIRE_COOLDOWN = 300;
const STAR_TINTS = [Colors.White, Colors.Red, Colors.White, Colors.Green, Colors.White, Colors.Blue];
const STAR_TIME = 10000;
const WAS_HURT_ALPHA = 0.2;
const WAS_HURT_TIME = 2000;
const DEATH_VELOCITY = -600;
const ENTER_PIPE_DURATION = 800;
const ENTER_PIPE_DEPTH = -100;
const EXIT_PIPE_DEPTH = 1;
const ENTER_PIPE_TRANSLATION = 80;
const ENTER_PIPE_START_Y = -200;

export class Player extends Phaser.GameObjects.Sprite {
  private lastPlayerKey: boolean = false; // TODO: Remove once player selection is in place
  private alive: boolean = true;
  private playerType: Players = Players.Caleb;
  private playerState: PlayerStates = PlayerStates.Default;

  private wasHurtTimer: number = 0;
  private flashToggle: boolean = false;
  private jumpTimer: number = 0;
  private jumping: boolean = false;
  private bending: boolean = false;
  private enteringPipe: boolean = false;
  private starActive: boolean = false;
  private starTimer: number = 0;
  private starStep: number = 0;
  private fireCoolDownTimer: number = 0;

  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, Players.Caleb);

    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.body.maxVelocity.x = MAX_VELOCITY_X;
    this.body.maxVelocity.y = MAX_VELOCITY_Y;
    this.small();

    const onAnimationComplete = () => {
      const animationGrow = getPlayerAnimationKey(this.playerType, PlayerActions.Grow);
      const animationShrink = getPlayerAnimationKey(this.playerType, PlayerActions.Shrink);

      if (this.anims.currentAnim.key === animationGrow || this.anims.currentAnim.key === animationShrink) {
        this.scene.physics.world.resume();
      }
    };

    this.on('animationcomplete', onAnimationComplete, this);
  }

  isAlive(): boolean {
    return this.alive;
  }

  getPlayerType(): Players {
    return this.playerType;
  }

  isPlayerState(playerState: PlayerStates): boolean {
    return playerState === this.playerState;
  }

  setPlayerState(playerState: PlayerStates) {
    return (this.playerState = playerState);
  }

  animate(animation: PlayerActions = PlayerActions.Stand, force: boolean = false) {
    const playerAnimation = getPlayerAnimationKey(this.playerType, animation, this.playerState);
    const hasAnimation: boolean = Boolean(this.anims.currentAnim);
    const isCurrentAnimation: boolean = hasAnimation && this.anims.currentAnim.key !== playerAnimation;
    const enableAnimation = !this.scene.physics.world.isPaused || force;

    if (!hasAnimation || (isCurrentAnimation && enableAnimation)) {
      this.anims.play(playerAnimation);
    }
  }

  update(delta: number, keys: Partial<ActionState>) {
    this.checkOutsideGame();

    // Don't do updates while entering the pipe or being dead
    if (this.enteringPipe || !this.alive) {
      return;
    }

    this.collideGround();
    this.updateAnimation(keys);
    this.updateFire(delta, keys.fire);
    this.updateStar(delta);
    this.updateWasHurt(delta);
    this.updateMovement(keys.left, keys.right);
    this.updateJump(delta, keys.jump);
    this.updateBending(keys.down);
  }

  // Methods to update player

  private checkOutsideGame() {
    const { height } = this.scene.gameConfig();

    if (this.y > height * 2) {
      this.scene.restart(); // Really superdead, has been falling for a while.
    } else if (this.y > height && this.alive) {
      this.die();
    }
  }

  collideGround() {
    // Just run callbacks when hitting something from below or trying to enter it
    if (this.body.velocity.y < 0 || this.bending) {
      this.scene.world.collide(this, (player: Player, tile: TiledGameObject) => this.scene.world.tileCollision(player, tile));
    } else {
      this.scene.world.collide(this);
    }
  }

  private updateAnimation(input: Partial<ActionState>) {
    // TODO: Remove once player selection is in place
    if (input.player && !this.lastPlayerKey) {
      this.playerType = this.playerType === Players.Caleb ? (this.playerType = Players.Sophia) : (this.playerType = Players.Caleb);
    }
    this.lastPlayerKey = input.player;

    let animation: PlayerActions = PlayerActions.Stand;

    if (Math.abs(this.body.velocity.y) > MIN_VELOCITY_Y && !this.body.blocked.down) {
      // Jumping
      animation = PlayerActions.Jump;
    } else if (this.body.velocity.x !== 0 || input.left || input.right) {
      // Running
      animation = PlayerActions.Walk;
      const turningLeft = this.body.velocity.x > 0 && this.body.acceleration.x < 0;
      const turningRight = this.body.velocity.x < 0 && this.body.acceleration.x > 0;

      if ((input.left || input.right) && (turningLeft || turningRight)) {
        animation = PlayerActions.Turn;
      } else if (this.playerState !== PlayerStates.Default && input.down && !(input.right || input.left)) {
        animation = PlayerActions.Bend;
      }
    } else {
      // Bending
      if (this.playerState !== PlayerStates.Default && input.down && !(input.right || input.left)) {
        animation = PlayerActions.Bend;
      }
    }

    this.animate(animation);
  }

  private updateFire(delta: number, fire: boolean) {
    if (this.fireCoolDownTimer > 0) {
      this.fireCoolDownTimer -= delta;
    }

    if (fire && this.playerState === PlayerStates.Fire && this.fireCoolDownTimer <= 0) {
      let fireball = this.scene.fireballs.get();
      if (fireball) {
        fireball.fire(this.x, this.y, this.flipX);
        this.fireCoolDownTimer = FIRE_COOLDOWN;
      }
    }
  }

  private updateWasHurt(delta: number) {
    if (this.wasHurtTimer > 0) {
      this.wasHurtTimer -= delta;
      this.flashToggle = !this.flashToggle;
      this.alpha = this.flashToggle ? WAS_HURT_ALPHA : 1;

      if (this.wasHurtTimer <= 0) {
        this.alpha = 1;
      }
    }
  }

  private updateStar(delta: number) {
    if (this.starActive) {
      if (this.starTimer <= 0) {
        this.starActive = false;
        this.starStep = 0;
        this.tint = STAR_TINTS[0];
      } else {
        this.starTimer -= delta;
        this.starStep = ++this.starStep % STAR_TINTS.length;
        this.tint = STAR_TINTS[this.starStep];
      }
    }
  }

  private updateMovement(left: boolean, right: boolean) {
    if (left && !this.body.blocked.left) {
      this.run(this.body.velocity.y === 0 ? -ACCELERATION : -ACCELERATION / 3);
      this.flipX = true;
    } else if (right && !this.body.blocked.right) {
      this.run(this.body.velocity.y === 0 ? ACCELERATION : ACCELERATION / 3);
      this.flipX = false;
    } else if (this.body.blocked.down) {
      // If in the ground with no input keys
      if (Math.abs(this.body.velocity.x) < MIN_VELOCITY_X) {
        // Static friction stops movement
        this.body.setVelocityX(0);
        this.run(0);
      } else {
        // Static friction reduces movement
        const direction: number = this.body.velocity.x > 0 ? -1 : 1;
        this.run((direction * ACCELERATION) / 2);
      }
    } else if (!this.body.blocked.down) {
      // If in the air, don't run
      this.run(0);
    }
  }

  private updateJump(delta: number, jump: boolean) {
    if (this.jumpTimer > 0) {
      this.jumpTimer -= delta;
    }

    if (jump && (!this.jumping || this.jumpTimer > 0)) {
      this.jump();
    } else if (!jump) {
      this.jumpTimer = 0; // Don't resume jump if button is released, prevents mini double-jumps

      if (this.body.blocked.down) {
        this.jumping = false;
      }
    }
  }

  private updateBending(down: boolean) {
    this.bending = down && !this.jumping && this.body.velocity.x < BEND_VELOCITY;
  }

  isBending(): boolean {
    return this.bending;
  }

  // Player actions

  private run(velocity: number) {
    if ((velocity > 0 && !this.body.blocked.right) || (velocity < 0 && !this.body.blocked.left)) {
      this.body.setAccelerationX(velocity);
    } else {
      this.body.setAccelerationX(0);
    }
  }

  private jump() {
    if (!this.body.blocked.down && !this.jumping) {
      return;
    }

    if (!this.jumping) {
      if (this.playerState === PlayerStates.Default) {
        this.scene.soundEffects.playEffect(Sounds.JumpSmall);
      } else {
        this.scene.soundEffects.playEffect(Sounds.JumpSuper);
      }

      this.jumpTimer = JUMP_TIME;
    }

    if (this.body.velocity.y < 0 || this.body.blocked.down) {
      this.body.setVelocityY(JUMP_VELOCITY);
    }

    this.jumping = true;
  }

  resize(large: boolean) {
    if (large) {
      this.large();
      this.playerState = PlayerStates.Super;
      this.play(getPlayerAnimationKey(this.playerType, PlayerActions.Grow));
    } else {
      this.small();
      this.playerState = PlayerStates.Default;
      this.play(getPlayerAnimationKey(this.playerType, PlayerActions.Shrink));
    }

    this.scene.physics.world.pause(); // Stop the world in transition
  }

  private small() {
    this.body.setSize(DEFAULT_BODY.width, DEFAULT_BODY.height);
    this.body.offset.set(DEFAULT_BODY.x, DEFAULT_BODY.y);
  }

  private large() {
    this.y -= SUPER_BODY.height - DEFAULT_BODY.height - (SUPER_BODY.y - DEFAULT_BODY.y); // Adjust sprite new position
    this.body.setSize(SUPER_BODY.width, SUPER_BODY.height);
    this.body.offset.set(SUPER_BODY.x, SUPER_BODY.y);
  }

  activateStar() {
    this.starActive = true;
    this.starTimer = STAR_TIME;
  }

  enemyBounce(enemy: Enemy) {
    // Force Player y-position up a bit (on top of the enemy) to avoid getting killed by neighboring enemy before being able to bounce
    this.body.y = enemy.body.y - this.body.height;
    this.body.setVelocityY(JUMP_VELOCITY);
  }

  hurtBy(enemy: Enemy) {
    if (!this.alive) {
      return;
    }

    if (this.starActive) {
      // Player has super-powers, enemy dies
      enemy.kill(true);
      enemy.updatePoints();
    } else if (this.wasHurtTimer <= 0) {
      // Player get's hurt
      if (this.playerState !== PlayerStates.Default) {
        this.resize(false);
        this.scene.soundEffects.playEffect(Sounds.Pipe);
        this.wasHurtTimer = WAS_HURT_TIME;
      } else {
        this.die();
      }
    }
  }

  die() {
    this.scene.soundEffects.pauseMusic();
    this.animate(PlayerActions.Death);
    this.scene.soundEffects.playEffect(Sounds.Die);
    this.body.setAcceleration(0);
    this.body.setVelocity(0, DEATH_VELOCITY);
    this.alive = false;
  }

  enterPipe(destinationTileId: number, pipeDirection: PipeDirection) {
    // TODO:  fix enter to right
    this.animate(PlayerActions.Bend);
    this.scene.soundEffects.playEffect(Sounds.Die);

    this.enteringPipe = true;
    this.body.setVelocity(0);
    this.body.setAcceleration(0);
    this.setDepth(ENTER_PIPE_DEPTH);

    let pipeX: number = 0;
    let pipeY: number = 0;

    switch (pipeDirection) {
      case PipeDirection.Right:
        pipeX = ENTER_PIPE_TRANSLATION;
        break;
      case PipeDirection.Left:
        pipeX = -ENTER_PIPE_TRANSLATION;
        break;
      default:
        pipeY = ENTER_PIPE_TRANSLATION;
    }

    this.scene.tweens.add({
      targets: this,
      x: this.x + pipeX,
      y: this.y + pipeY,
      duration: ENTER_PIPE_DURATION,
      onComplete: () => this.exitPipe(destinationTileId),
    });
  }

  private exitPipe(destinationTileId: number) {
    const destination = this.scene.modifiers.getDestination(destinationTileId);

    if (destination.top) {
      this.setDepth(EXIT_PIPE_DEPTH);
      this.enteringPipe = false;
      this.x = destination.x;
      this.y = ENTER_PIPE_START_Y;
    } else {
      let pipeX: number = 0;
      let pipeY: number = 0;

      switch (destination.direction) {
        case PipeDirection.Right:
          pipeX = -this.body.width;
          break;
        case PipeDirection.Left:
          pipeX = this.body.width;
          break;
        default:
          pipeY = this.body.height * 1.5;
      }

      this.x = destination.x + pipeX;
      this.y = destination.y + pipeY;

      this.scene.tweens.add({
        targets: this,
        x: this.x - pipeX * 2,
        y: this.y - pipeY * 2,
        duration: ENTER_PIPE_DURATION,
        onComplete: () => {
          this.setDepth(EXIT_PIPE_DEPTH);
          this.enteringPipe = false;
        },
      });
    }

    this.scene.world.setRoomBounds();
  }
}
