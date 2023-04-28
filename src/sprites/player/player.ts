import { GtmEventTypes, pushEvent } from '@game/analytics';
import { getPlayerAnimationKey } from '@game/animations';
import {
  ActionState,
  Body,
  Colors,
  Depths,
  GameOptions,
  PipeDirection,
  PlayerActions,
  Players,
  PlayerStates,
  Sounds,
  TiledGameObject,
} from '@game/models';
import { GameScene } from '@game/scenes';

import { Enemy } from '../enemies';

const DEFAULT_BODY: Body = { width: 20, height: 20, x: 7, y: 12 };
const SUPER_BODY: Body = { width: 20, height: 44, x: 23, y: 20 };

const ACCELERATION = 1200;
const JUMPING_ACCELERATION = ACCELERATION / 2;
const STATIC_FRICTION_ACCELERATION = ACCELERATION / 2;

const MIN_VELOCITY_X = 20;
const MIN_VELOCITY_Y = 40;
const MAX_VELOCITY_X = 400;
const MAX_VELOCITY_Y = 800;
const JUMP_VELOCITY = -400;
const JUMP_TIME = 300;
const BEND_VELOCITY = 200;
const THROW_BIBLE_COOLDOWN = 500;
const SUPER_TINTS = [Colors.White, Colors.Red, Colors.White, Colors.Green, Colors.White, Colors.Blue];
const SUPER_TIME = 10000;
const WAS_HURT_ALPHA = 0.2;
const WAS_HURT_TIME = 2000;
const DEATH_VELOCITY = -600;
const ENTER_PIPE_DURATION = 800;
const EXIT_PIPE_DEPTH = 1;
const ENTER_PIPE_TRANSLATION = 80;
const ENTER_PIPE_START_Y = -200;

const HIDDEN_ROOM = 1;

export class Player extends Phaser.GameObjects.Sprite {
  private alive: boolean;
  private playerType: Players;
  playerState: PlayerStates;

  private wasHurtTimer: number;
  private flashToggle: boolean;
  private jumpTimer: number;
  private jumping: boolean;
  private bending: boolean;
  private enteringPipe: boolean;
  private superActive: boolean;
  private superTimer: number;
  private superStep: number;
  private superCoolDownTimer: number;
  private lastVelocityY: number[];
  private hidden: boolean;

  body: Phaser.Physics.Arcade.Body;

  constructor(public scene: GameScene, x: number, y: number) {
    super(scene, x, y, Players.Caleb);

    this.updatePlayerType();

    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.body.setMaxVelocity(MAX_VELOCITY_X, MAX_VELOCITY_Y);
    this.init();

    const onAnimationComplete = () => {
      const animationGrow = getPlayerAnimationKey(this.playerType, PlayerActions.Grow);
      const animationShrink = getPlayerAnimationKey(this.playerType, PlayerActions.Shrink);

      if (this.anims.currentAnim.key === animationGrow || this.anims.currentAnim.key === animationShrink) {
        this.scene.physics.world.resume();
      }
    };

    this.on(Phaser.Animations.Events.SPRITE_ANIMATION_COMPLETE, onAnimationComplete, this);
  }

  init() {
    this.alive = true;
    this.wasHurtTimer = 0;
    this.flashToggle = false;
    this.jumpTimer = 0;
    this.jumping = false;
    this.bending = false;
    this.enteringPipe = false;
    this.superActive = false;
    this.superStep = 0;
    this.superCoolDownTimer = 0;
    this.lastVelocityY = [];
    this.hidden = this.scene.isScoreboardActive();
    this.body.setEnable(!this.hidden);
    this.setAlpha(this.hidden ? 0 : 1);

    this.body.setVelocity(0, 0);
    this.setFlipX(false);
    this.clearTint();

    this.playerState = PlayerStates.Default;
    this.small();
    this.animate(PlayerActions.Stand, true);
  }

  isAlive(): boolean {
    return this.alive;
  }

  isSuper(): boolean {
    return this.superActive;
  }

  getPlayerType(): Players {
    return this.playerType;
  }

  private updatePlayerType() {
    const playerType: Players = this.scene.getRegistry(GameOptions.Player) || Players.Caleb;

    if (this.playerType !== playerType) {
      this.playerType = playerType;
      this.animate();
    }
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
    if (this.enteringPipe || !this.alive || this.hidden) {
      return;
    }

    this.collideGround();
    this.updatePlayerType();
    this.updateAnimation(keys);
    this.updateSuper(delta, keys.throwBible);
    this.updateStar(delta);
    this.updateWasHurt(delta);
    this.updateMovement(keys.left, keys.right);
    this.updateJump(delta, keys.jump);
    this.updateBending(keys.down);
  }

  // Methods to update player

  private checkOutsideGame() {
    const { height } = this.scene.getGameDimensions();

    if (this.y > height * 2) {
      if (this.body.enable) {
        this.body.setEnable(false);
        this.scene.playerDied();
      }
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
    let animation: PlayerActions = PlayerActions.Stand;

    // When jumping at the top of the jump, there is a flickr in the animation. This check that the player is really stopped in Y axis
    this.lastVelocityY.push(this.body.velocity.y);
    this.lastVelocityY = this.lastVelocityY.slice(-5);
    const stoppedY = this.lastVelocityY.map((velY) => Math.abs(velY) < MIN_VELOCITY_Y).reduce((prev, curr) => curr && prev, true);

    if (!stoppedY && !this.body.blocked.down) {
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

  private updateSuper(delta: number, throwBible: boolean) {
    if (this.superCoolDownTimer > 0) {
      this.superCoolDownTimer -= delta;
    }

    if (throwBible && this.playerState === PlayerStates.Super && this.superCoolDownTimer <= 0) {
      let bible = this.scene.bibles.get();
      if (bible) {
        bible.throw(this.x, this.y, this.flipX);
        this.superCoolDownTimer = THROW_BIBLE_COOLDOWN;
      }
    }
  }

  private updateWasHurt(delta: number) {
    if (this.wasHurtTimer > 0) {
      this.wasHurtTimer -= delta;
      this.flashToggle = !this.flashToggle;
      this.setAlpha(this.flashToggle ? WAS_HURT_ALPHA : 1);

      if (this.wasHurtTimer <= 0) {
        this.setAlpha(1);
      }
    }
  }

  private updateStar(delta: number) {
    if (this.superActive) {
      if (this.superTimer <= 0) {
        this.superActive = false;
        this.superStep = 0;
        this.tint = SUPER_TINTS[0];
      } else {
        this.superTimer -= delta;
        this.superStep = ++this.superStep % SUPER_TINTS.length;
        this.tint = SUPER_TINTS[this.superStep];
      }
    }
  }

  private updateMovement(left: boolean, right: boolean) {
    if (left && !this.body.blocked.left) {
      this.run(this.body.velocity.y === 0 ? -ACCELERATION : -JUMPING_ACCELERATION);
      this.setFlipX(true);
    } else if (right && !this.body.blocked.right) {
      this.run(this.body.velocity.y === 0 ? ACCELERATION : JUMPING_ACCELERATION);
      this.setFlipX(false);
    } else if (this.body.blocked.down) {
      // If in the ground with no input keys
      if (Math.abs(this.body.velocity.x) < MIN_VELOCITY_X) {
        // Static friction stops movement
        this.body.setVelocityX(0);
        this.run(0);
      } else {
        // Static friction reduces movement
        const direction: number = this.body.velocity.x > 0 ? -1 : 1;
        this.run(direction * STATIC_FRICTION_ACCELERATION);
      }
    } else if (!this.body.blocked.down) {
      // If in the air, don't run
      this.run(0);
    }

    if (this.x < this.body.width) {
      this.x = this.body.width;
      this.body.setVelocityX(0);
      this.run(0);
    }
  }

  private updateJump(delta: number, jump: boolean) {
    if (this.jumpTimer > 0) {
      this.jumpTimer -= delta;
    }

    if (this.body.y + this.body.height / 2 < 0) {
      this.body.y = -this.body.height / 2;
      this.body.setVelocityY(MIN_VELOCITY_Y);
      this.jumpTimer = 0;
    }

    if (this.body.blocked.down || Math.abs(this.body.velocity.y) < MIN_VELOCITY_Y) {
      this.jumping = false;
    }

    if (jump && (!this.jumping || this.jumpTimer > 0)) {
      this.jump();
    } else if (!jump) {
      this.jumpTimer = 0; // Don't resume jump if button is released, prevents mini double-jumps
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
        this.scene.soundEffects.playEffect(Sounds.JumpBig);
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
      this.playerState = PlayerStates.Big;
      this.play(getPlayerAnimationKey(this.playerType, PlayerActions.Grow));
    } else {
      this.small();
      this.playerState = PlayerStates.Default;
      this.play(getPlayerAnimationKey(this.playerType, PlayerActions.Shrink));
    }

    this.scene.physics.world.pause(); // Stop the world in transition
  }

  private small() {
    this.clearTint();
    this.body.setSize(DEFAULT_BODY.width, DEFAULT_BODY.height);
    this.body.offset.set(DEFAULT_BODY.x, DEFAULT_BODY.y);
  }

  private large() {
    this.clearTint();
    this.y += SUPER_BODY.y - DEFAULT_BODY.y; // Adjust sprite new position
    this.body.setSize(SUPER_BODY.width, SUPER_BODY.height);
    this.body.offset.set(SUPER_BODY.x, SUPER_BODY.y);
  }

  activateStar() {
    this.superActive = true;
    this.superTimer = SUPER_TIME;
  }

  enemyBounce(enemy: Enemy) {
    // Force Player y-position up a bit (on top of the enemy) to avoid getting killed by neighboring enemy before being able to bounce
    this.body.y = enemy.body.y - enemy.body.height - this.body.halfHeight;
    this.body.setVelocityY(JUMP_VELOCITY);
  }

  hurtBy(enemy: Enemy) {
    if (!this.alive) {
      return;
    }

    if (this.scene.demo.isActive()) {
      // In demo mode collision with enemies always kills them
      enemy.kill(true);
      enemy.updatePoints();
    } else if (this.wasHurtTimer <= 0) {
      // Player get's hurt
      if (this.playerState !== PlayerStates.Default) {
        this.resize(false);
        this.scene.soundEffects.playEffect(Sounds.Pipe);
        this.startGraceTime();
      } else {
        this.die();
      }
    }

    this.scene.physics.world.resume();
  }

  startGraceTime() {
    this.wasHurtTimer = WAS_HURT_TIME;
  }

  die() {
    this.clearTint();
    this.scene.soundEffects.pauseMusic();
    this.animate(PlayerActions.Death);
    this.scene.soundEffects.playEffect(Sounds.Die);
    this.body.setAcceleration(0, 0);
    this.body.setVelocity(0, DEATH_VELOCITY);
    this.alive = false;
  }

  enterPipe(destinationTileId: number, pipeDirection: PipeDirection, centerX: number, centerY: number) {
    this.animate(PlayerActions.Bend);
    this.scene.soundEffects.playEffect(Sounds.Pipe);

    this.enteringPipe = true;
    this.body.setVelocity(0);
    this.body.setAcceleration(0, 0);
    this.body.setEnable(false);
    this.setDepth(Depths.EnterPipe);
    this.scene.stopFollowingPlayer();
    this.clearTint();

    let pipeX: number = 0;
    let pipeY: number = 0;

    switch (pipeDirection) {
      case PipeDirection.Right:
        pipeX = this.x + ENTER_PIPE_TRANSLATION;
        pipeY = centerY;
        break;
      case PipeDirection.Left:
        pipeX = this.x - ENTER_PIPE_TRANSLATION;
        break;
      default:
        pipeX = centerX;
        pipeY = this.y + ENTER_PIPE_TRANSLATION;
    }

    this.scene.tweens.add({
      targets: this,
      x: pipeX,
      y: pipeY,
      duration: ENTER_PIPE_DURATION,
      onComplete: () => this.exitPipe(destinationTileId),
    });
  }

  private exitPipe(destinationTileId: number) {
    const destination = this.scene.modifiers.getDestination(destinationTileId);
    this.body.setEnable(true);
    this.scene.followPlayer();

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

    if (this.scene.world.getRoom(this.scene.player) === HIDDEN_ROOM) {
      pushEvent({ event: GtmEventTypes.HiddenRoom });
    }
  }
}
