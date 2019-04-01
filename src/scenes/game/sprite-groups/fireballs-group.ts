import { Fire } from '../../../sprites';
import { GameScene } from '../game-scene';

export class FireballsGroup {
  private group: Phaser.GameObjects.Group;

  constructor(private scene: GameScene) {
    this.init();
  }

  private init() {
    this.group = this.scene.add.group({
      classType: Fire,
      maxSize: 10,
      runChildUpdate: false, // Due to https://github.com/photonstorm/phaser/issues/3724
    });
  }

  get(): Fire {
    return this.group.get();
  }

  update(time: number, delta: number) {
    Array.from(this.group.children.entries).forEach((fireball: Fire) => {
      fireball.update(time, delta);
    });
  }
}
