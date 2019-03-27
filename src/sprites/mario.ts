import { getPlayerAnimationKey } from '../animations';
import { Body, PlayerActions, Players, PlayerStates } from '../models';
import { ActionState, GameScene, TiledGameObject } from '../scenes';
import { Enemy } from './enemy';

export enum PipeDirection {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export interface IPlayer {
  type: 'mario';
}

export class Mario extends Phaser.GameObjects.Sprite implements IPlayer {
  static DEFAULT_BODY: Body = { width: 10, height: 10, x: 3, y: 6 };
  static SUPER_BODY: Body = { width: 10, height: 22, x: 3, y: 10 };
  static ACCELERATION = 600;
  static MIN_VELOCITY_X = 10;
  static MIN_VELOCITY_Y = 15;
  static MAX_VELOCITY_X = 200;
  static MAX_VELOCITY_Y = 500;
  static JUMP_VELOCITY = -200;
  static JUMP_TIME = 300;
  static BEND_VELOCITY = 100;
  static FIRE_COOLDOWN = 300;
  static STAR_TINTS = [0xffffff, 0xff0000, 0xffffff, 0x00ff00, 0xffffff, 0x0000ff];
  static STAR_TIME = 10000;
  static WAS_HURT_ALPHA = 0.2;
  static WAS_HURT_TIME = 2000;
  static DEATH_VELOCITY = -300;
  static ENTER_PIPE_DURATION = 800;
  static ENTER_PIPE_DEPTH = -100;
  static EXIT_PIPE_DEPTH = 1;
  static ENTER_PIPE_TRANSLATION = 40;
  static ENTER_PIPE_START_Y = -100;

  protected readonly currentScene: GameScene;
  private jumpTimer: number = 0;
  private jumping: boolean = false;
  private lastPlayerKey: boolean = false; // TODO: Remove
  private playerType: Players = Players.Caleb;
  bending: boolean = false;
  private enteringPipe: boolean = false;
  private wasHurtTimer: number = 0;
  private flashToggle: boolean = false;
  private fireCoolDownTimer: number = 0;
  private starActive: boolean = false;
  private starTimer: number = 0;
  private starStep: number = 0;
  readonly type = 'mario';
  playerState: PlayerStates = PlayerStates.Default;
  alive: boolean = true;

  constructor(config) {
    super(config.scene, config.x, config.y, config.key);

    this.currentScene = config.scene;
    config.scene.physics.world.enable(this);
    config.scene.add.existing(this);

    this.init();
    this.animate();
  }

  private init() {
    this.body.maxVelocity.x = Mario.MAX_VELOCITY_X;
    this.body.maxVelocity.y = Mario.MAX_VELOCITY_Y;
    this.small();

    const onAnimationComplete = () => {
      const animationGrow = getPlayerAnimationKey(this.playerType, PlayerActions.Grow);
      const animationShrink = getPlayerAnimationKey(this.playerType, PlayerActions.Shrink);

      if (this.anims.currentAnim.key === animationGrow || this.anims.currentAnim.key === animationShrink) {
        this.currentScene.physics.world.resume();
      }
    };

    this.on('animationcomplete', onAnimationComplete, this);
  }

  animate(animation: PlayerActions = PlayerActions.Stand) {
    const playerAnimation = getPlayerAnimationKey(this.playerType, animation, this.playerState);

    if (!this.anims.currentAnim || (this.anims.currentAnim.key !== playerAnimation && !this.currentScene.physics.world.isPaused)) {
      this.anims.play(playerAnimation);
    }
  }

  update(time: number, delta: number, keys: Partial<ActionState>) {
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
    if (this.y > this.currentScene.sys.game.config.height * 2) {
      this.currentScene.scene.start('TitleScene'); // Really superdead, has been falling for a while.
    } else if (this.y > this.currentScene.sys.game.config.height && this.alive) {
      this.die();
    }
  }

  private collideGround() {
    // Just run callbacks when hitting something from below or trying to enter it
    if (this.body.velocity.y < 0 || this.bending) {
      this.currentScene.physics.world.collide(this, this.currentScene.groundLayer, (player: Mario, tile: TiledGameObject) =>
        this.currentScene.tileCollision(player, tile)
      );
    } else {
      this.currentScene.physics.world.collide(this, this.currentScene.groundLayer);
    }
  }

  private updateAnimation(input: Partial<ActionState>) {
    // TODO: Remove once player selection is in place
    if (input.player && !this.lastPlayerKey) {
      this.playerType = this.playerType === Players.Caleb ? (this.playerType = Players.Sophia) : (this.playerType = Players.Caleb);
    }
    this.lastPlayerKey = input.player;

    let animation: PlayerActions = PlayerActions.Stand;

    if (Math.abs(this.body.velocity.y) > Mario.MIN_VELOCITY_Y && !this.body.blocked.down) {
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
      let fireball = this.currentScene.fireballs.get(this);
      if (fireball) {
        fireball.fire(this.x, this.y, this.flipX);
        this.fireCoolDownTimer = Mario.FIRE_COOLDOWN;
      }
    }
  }

  private updateWasHurt(delta: number) {
    if (this.wasHurtTimer > 0) {
      this.wasHurtTimer -= delta;
      this.flashToggle = !this.flashToggle;
      this.alpha = this.flashToggle ? Mario.WAS_HURT_ALPHA : 1;

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
        this.tint = Mario.STAR_TINTS[0];
      } else {
        this.starTimer -= delta;
        this.starStep = ++this.starStep % Mario.STAR_TINTS.length;
        this.tint = Mario.STAR_TINTS[this.starStep];
      }
    }
  }

  private updateMovement(left: boolean, right: boolean) {
    if (left && !this.body.blocked.left) {
      this.run(this.body.velocity.y === 0 ? -Mario.ACCELERATION : -Mario.ACCELERATION / 3);
      this.flipX = true;
    } else if (right && !this.body.blocked.right) {
      this.run(this.body.velocity.y === 0 ? Mario.ACCELERATION : Mario.ACCELERATION / 3);
      this.flipX = false;
    } else if (this.body.blocked.down) {
      // If in the ground with no input keys
      if (Math.abs(this.body.velocity.x) < Mario.MIN_VELOCITY_X) {
        // Static friction stops movement
        this.body.setVelocityX(0);
        this.run(0);
      } else {
        // Static friction reduces movement
        const direction: number = this.body.velocity.x > 0 ? -1 : 1;
        this.run((direction * Mario.ACCELERATION) / 2);
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
    this.bending = down && !this.jumping && this.body.velocity.x < Mario.BEND_VELOCITY;
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
        this.currentScene.sound.playAudioSprite('sfx', 'smb_jump-small'); // TODO: Refactor play into scene
      } else {
        this.currentScene.sound.playAudioSprite('sfx', 'smb_jump-super');
      }

      this.jumpTimer = Mario.JUMP_TIME;
    }

    if (this.body.velocity.y < 0 || this.body.blocked.down) {
      this.body.setVelocityY(Mario.JUMP_VELOCITY);
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

    this.currentScene.physics.world.pause(); // Stop the world in transition
  }

  private small() {
    this.body.setSize(Mario.DEFAULT_BODY.width, Mario.DEFAULT_BODY.height);
    this.body.offset.set(Mario.DEFAULT_BODY.x, Mario.DEFAULT_BODY.y);
  }

  private large() {
    this.y -= Mario.SUPER_BODY.height - Mario.DEFAULT_BODY.height - (Mario.SUPER_BODY.y - Mario.DEFAULT_BODY.y); // Adjust sprite new position
    this.body.setSize(Mario.SUPER_BODY.width, Mario.SUPER_BODY.height);
    this.body.offset.set(Mario.SUPER_BODY.x, Mario.SUPER_BODY.y);
  }

  activateStar() {
    this.starActive = true;
    this.starTimer = Mario.STAR_TIME;
  }

  enemyBounce(enemy: Enemy) {
    // Force Mario y-position up a bit (on top of the enemy) to avoid getting killed by neigbouring enemy before being able to bounce
    this.body.y = enemy.body.y - this.body.height;
    this.body.setVelocityY(Mario.JUMP_VELOCITY);
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
      // Mario get's hurt
      if (this.playerState !== PlayerStates.Default) {
        this.resize(false);
        this.currentScene.sound.playAudioSprite('sfx', 'smb_pipe');
        this.wasHurtTimer = Mario.WAS_HURT_TIME;
      } else {
        this.die();
      }
    }
  }

  die() {
    this.currentScene.music.pause();
    this.animate(PlayerActions.Death);
    this.currentScene.sound.playAudioSprite('sfx', 'smb_mariodie');
    this.body.setAcceleration(0);
    this.body.setVelocity(0, Mario.DEATH_VELOCITY);
    this.alive = false;
  }

  enterPipe(destinationTileId: number, pipeDirection: PipeDirection) {
    // TODO:  fix enter to right
    this.animate(PlayerActions.Bend);
    this.currentScene.sound.playAudioSprite('sfx', 'smb_pipe');

    this.enteringPipe = true;
    this.body.setVelocity(0);
    this.body.setAcceleration(0);
    this.setDepth(Mario.ENTER_PIPE_DEPTH);

    let pipeX: number = 0;
    let pipeY: number = 0;

    switch (pipeDirection) {
      case PipeDirection.Right:
        pipeX = Mario.ENTER_PIPE_TRANSLATION;
        break;
      case PipeDirection.Left:
        pipeX = -Mario.ENTER_PIPE_TRANSLATION;
        break;
      default:
        pipeY = Mario.ENTER_PIPE_TRANSLATION;
    }

    this.currentScene.tweens.add({
      targets: this,
      x: this.x + pipeX,
      y: this.y + pipeY,
      duration: Mario.ENTER_PIPE_DURATION,
      onComplete: () => this.exitPipe(destinationTileId),
    });
  }

  private exitPipe(destinationTileId: number) {
    const destination = this.currentScene.destinations[destinationTileId]; // TODO: Add typing

    if (destination.top) {
      this.setDepth(Mario.EXIT_PIPE_DEPTH);
      this.enteringPipe = false;
      this.x = destination.x;
      this.y = Mario.ENTER_PIPE_START_Y;
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

      this.currentScene.tweens.add({
        targets: this,
        x: this.x - pipeX * 2,
        y: this.y - pipeY * 2,
        duration: Mario.ENTER_PIPE_DURATION,
        onComplete: () => {
          this.setDepth(Mario.EXIT_PIPE_DEPTH);
          this.enteringPipe = false;
        },
      });
    }

    this.setRoomBounds(this.currentScene.rooms);
  }

  setRoomBounds(rooms) {
    // TODO: Move logic to game scene
    rooms.forEach((room) => {
      if (this.x >= room.x && this.x <= room.x + room.width) {
        let camera: Phaser.Cameras.Scene2D.Camera = this.currentScene.cameras.main;
        let groundLayer = this.currentScene.groundLayer;
        camera.setBounds(room.x, 0, room.width * groundLayer.scaleX, groundLayer.height * groundLayer.scaleY);
        this.currentScene.finishLine.active = room.x === 0;
        this.currentScene.cameras.main.setBackgroundColor(room.sky);
      }
    });
  }
}
