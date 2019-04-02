import { TurtleAnimations } from '@game/animations';
import { Body, Sounds, TiledGameObject } from '@game/models';
import { GameScene } from '@game/scenes';

import { Enemy } from './enemy';

const DIMENSIONS: Partial<Body> = { x: 2, y: 24 };
const SLIDE_VELOCITY: number = 300;

export class Turtle extends Enemy {
  private sliding: boolean = false;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y);

    this.anims.play(TurtleAnimations.Default);
    this.flipX = true;
    this.setBody(DIMENSIONS);
  }

  update() {
    if (!this.isActivated()) {
      return;
    }

    if (this.sliding) {
      // Turtle destroys tiles when sliding
      this.scene.world.collide(this, (object: Phaser.GameObjects.Sprite, tile: TiledGameObject) =>
        this.scene.world.tileCollision(object, tile)
      );
      this.scene.enemies.overlapTurtle(this);
    } else {
      this.collideGround();
    }

    // Collide with Player
    this.scene.physics.world.overlap(this, this.scene.player, () => this.playerHit());

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
    if (this.isVerticalHit()) {
      this.updatePoints();

      // Set the turtle shell and start to slide
      if (!this.sliding || (this.sliding && this.body.velocity.x === 0)) {
        this.scene.soundEffects.playEffect(Sounds.Kick);

        this.direction = SLIDE_VELOCITY * (this.scene.player.x < this.x ? 1 : -1);
        this.body.velocity.x = this.direction;
      } else {
        this.scene.soundEffects.playEffect(Sounds.Stomp);

        this.direction = 0;
        this.body.velocity.x = 0;
      }

      this.sliding = true;
      this.play(TurtleAnimations.Shell);
      this.scene.player.enemyBounce(this);
    } else {
      // Player hit
      if (this.sliding && this.body.velocity.x === 0) {
        this.scene.soundEffects.playEffect(Sounds.Kick);

        this.direction = SLIDE_VELOCITY;
        this.body.velocity.x = SLIDE_VELOCITY;
      }
      this.hurtPlayer();
    }
  }
}
