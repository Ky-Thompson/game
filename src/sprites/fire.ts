import { Body } from '../models';
import { GameScene } from '../scenes';
import { Enemy } from './enemy';

export enum FireAnimations {
  Explode = 'fireExplode',
  Shrink = 'shrink',
  Fly = 'fireFly',
}

// Rename to fireball

export class Fire extends Phaser.GameObjects.Sprite {
  static DIMENSIONS: Body = { width: 8, height: 8, x: 0, y: 0 };
  static VELOCITY_X = 400;
  static COLLIDE_VELOCITY_Y = -150;

  protected readonly currentScene: GameScene;

  body: Phaser.Physics.Arcade.Body;

  constructor(scene) {
    super(scene, 0, 0, '');

    this.currentScene = scene;
    this.currentScene.physics.world.enable(this);

    this.init();
  }

  private init() {
    this.body.setSize(Fire.DIMENSIONS.width, Fire.DIMENSIONS.height);
    this.body.offset.set(Fire.DIMENSIONS.x, Fire.DIMENSIONS.y);

    const onAnimationComplete = () => {
      if (this.anims.currentAnim.key === FireAnimations.Explode || this.anims.currentAnim.key === FireAnimations.Shrink) {
        this.setActive(false);
        this.setVisible(false);
      }
    };
    this.on('animationcomplete', onAnimationComplete, this);
  }

  update(time: number, delta: number) {
    if (!this.active) {
      return;
    }

    this.currentScene.physics.world.collide(this, this.currentScene.groundLayer, () => this.collided());
    this.currentScene.physics.world.overlap(this, this.currentScene.enemyGroup, (fire: Fire, enemy: Enemy) => {
      fire.explode();
      enemy.kill(true);
      enemy.updatePoints();
    });
  }

  private collided() {
    if (this.body.velocity.y === 0) {
      this.body.velocity.y = Fire.COLLIDE_VELOCITY_Y; // Bounce on horizontal collision
    }

    if (this.body.velocity.x === 0) {
      this.currentScene.sound.playAudioSprite('sfx', 'smb_bump'); // TODO: Refactor
      this.explode();
    }
  }

  private explode() {
    this.body.allowGravity = false;
    this.body.velocity.y = 0;
    this.play(FireAnimations.Explode);
  }

  fire(x: number, y: number, leftDirection: boolean) {
    this.setPosition(x, y);
    this.body.velocity.x = Fire.VELOCITY_X * (leftDirection ? -1 : 1);
    this.body.allowGravity = true;

    this.setActive(true);
    this.setVisible(true);

    this.play(FireAnimations.Fly);
    this.currentScene.sound.playAudioSprite('sfx', 'smb_fireball'); // TODO: Refactor
  }
}
