import { Fireball } from '../../../sprites';
import { GameScene } from '../scene';

export class FireballsGroup {
  private readonly group: Phaser.GameObjects.Group;

  constructor(private scene: GameScene) {
    this.group = this.scene.add.group({
      classType: Fireball,
      maxSize: 10,
      runChildUpdate: false, // Due to https://github.com/photonstorm/phaser/issues/3724
    });
  }

  get(): Fireball {
    return this.group.get();
  }

  update(time: number, delta: number) {
    Array.from(this.group.children.entries).forEach((fireball: Fireball) => {
      fireball.update(time, delta);
    });
  }
}
