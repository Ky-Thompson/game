import { Fireball } from '@game/sprites';

import { GameScene } from '../scene';

export class FireballsGroup {
  private readonly group: Phaser.GameObjects.Group;

  constructor(private scene: GameScene) {
    this.group = this.scene.add.group({
      classType: <any>Fireball,
      maxSize: 10,
      runChildUpdate: false, // Due to https://github.com/photonstorm/phaser/issues/3724
    });
  }

  get(): Fireball {
    return this.group.get();
  }

  update() {
    Array.from(this.group.children.entries).forEach((fireball: Fireball) => {
      fireball.update();
    });
  }
}
