import { GameScene } from '@game/scenes';
import { Bible } from '@game/sprites';

export class BiblesGroup {
  private readonly group: Phaser.GameObjects.Group;

  constructor(private scene: GameScene) {
    this.group = this.scene.add.group({
      classType: <any>Bible,
      maxSize: 10,
      runChildUpdate: false, // Due to https://github.com/photonstorm/phaser/issues/3724
    });
  }

  get(): Bible {
    return this.group.get();
  }

  update() {
    Array.from(this.group.children.entries).forEach((bible: Bible) => {
      bible.update();
    });
  }
}
