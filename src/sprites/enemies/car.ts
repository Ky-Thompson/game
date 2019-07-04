import { CarAnimations } from '@game/animations';
import { Body, Sounds, TiledGameObject } from '@game/models';
import { GameScene } from '@game/scenes';

import { Enemy } from './enemy';

const DIMENSIONS: Body = { width: 40, height: 20, x: 4, y: 12 };
const SLIDE_VELOCITY: number = 300;

export class Car extends Enemy {
  private sliding: boolean = false;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y);

    this.setFlipX(true);
    this.setBody(DIMENSIONS);
    this.animate();
  }

  private animate(animation: CarAnimations = CarAnimations.Default) {
    this.anims.play(animation);
  }

  update() {
    if (!this.isActivated()) {
      return;
    }

    if (this.sliding && !this.dropped) {
      // Car destroys tiles when sliding
      this.scene.world.collide(this, (object: Phaser.GameObjects.Sprite, tile: TiledGameObject) =>
        this.scene.world.tileCollision(object, tile)
      );
      this.scene.enemies.overlapCar(this);
    } else {
      this.collideGround();
    }

    // Collide with Player
    this.collidePlayer();

    // The enemy stopped, better try to walk in the other direction.
    if (this.body.velocity.x === 0) {
      this.direction = -this.direction;
      this.body.setVelocityX(this.direction);
      this.setFlipX(this.direction < 0);
    }
  }

  slideKill(victim: Enemy) {
    if (victim.kill && victim.isAlive()) {
      victim.updatePoints();
      victim.kill(true);
    }
  }

  playerHit() {
    if (this.isVerticalHit()) {
      this.updatePoints();

      // Set the car crushed and start to slide
      if (this.sliding && this.body.velocity.x === 0) {
        this.scene.soundEffects.playEffect(Sounds.Kick);

        this.direction = SLIDE_VELOCITY * (this.scene.player.x < this.x ? 1 : -1);
      } else {
        this.scene.soundEffects.playEffect(Sounds.Stomp);
        this.direction = 0;
      }

      this.sliding = true;
      this.body.setVelocityX(0);
      this.animate(CarAnimations.Crushed);
      this.scene.player.enemyBounce(this);
    } else {
      // Player hit
      if (this.sliding && this.body.velocity.x === 0) {
        this.scene.soundEffects.playEffect(Sounds.Kick);

        this.direction = SLIDE_VELOCITY * (this.scene.player.x < this.x ? 1 : -1);
        this.body.setVelocityX(SLIDE_VELOCITY);
      }
      this.hurtPlayer();
    }
  }
}
