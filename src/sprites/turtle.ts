import { TurtleAnimations } from '../animations';
import { Body, TiledGameObject } from '../models';
import { Enemy } from './enemy';

export class Turtle extends Enemy {
  static DIMENSIONS: Partial<Body> = { x: 2, y: 24 };
  static SLIDE_VELOCITY: number = 300;

  private sliding: boolean = false;
  readonly type = 'turtle';

  constructor(config) {
    super(config);

    this.anims.play(TurtleAnimations.Default);
    this.flipX = true;
    this.setBody(Turtle.DIMENSIONS);
  }

  update() {
    if (!this.isActivated) {
      return;
    }

    if (this.sliding) {
      this.currentScene.world.collide(this, (object: Phaser.GameObjects.Sprite, tile: TiledGameObject) =>
        this.currentScene.tileCollision(object, tile)
      ); // Turtle destroys tiles when sliding
      this.currentScene.enemies.overlapTurtle(this);
    } else {
      this.collideGround();
    }

    // Collide with Player
    this.currentScene.physics.world.overlap(this, this.currentScene.mario, () => this.playerHit());

    // The enemy stopped, better try to walk in the other direction.
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.velocity.x = this.direction;
      this.flipX = this.direction < 0;
    }
  }

  slideKill(victim: Enemy) {
    if (victim.kill) {
      victim.kill(true);
    }
  }

  playerHit() {
    if (this.isVerticalHit) {
      this.updatePoints();

      // Set the turtle shell and start to slide
      if (!this.sliding || (this.sliding && this.body.velocity.x === 0)) {
        this.scene.sound.playAudioSprite('sfx', 'smb_kick');

        this.direction = Turtle.SLIDE_VELOCITY * (this.player.x < this.x ? 1 : -1);
        this.body.velocity.x = this.direction;
      } else {
        this.scene.sound.playAudioSprite('sfx', 'smb_stomp');

        this.direction = 0;
        this.body.velocity.x = 0;
      }

      this.sliding = true;
      this.play(TurtleAnimations.Shell);
      this.player.enemyBounce(this);
    } else {
      // Player hit
      if (this.sliding && this.body.velocity.x === 0) {
        this.scene.sound.playAudioSprite('sfx', 'smb_kick');

        this.direction = Turtle.SLIDE_VELOCITY;
        this.body.velocity.x = Turtle.SLIDE_VELOCITY;
      }
      this.hurtPlayer();
    }
  }
}
