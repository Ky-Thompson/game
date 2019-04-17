import { TiledGameObject } from '@game/models';
import { Bible, BounceBrick, Car, Enemy, EnemyTypes, Liar } from '@game/sprites';

import { GameScene } from '../scene';
import { World, WorldLayers } from './world';

export class EnemyGroup {
  private readonly group: Phaser.GameObjects.Group;
  private readonly mapLayer: Phaser.Tilemaps.ObjectLayer;
  private readonly tileset: Phaser.Tilemaps.Tileset;

  constructor(private scene: GameScene, private world: World) {
    this.mapLayer = this.world.getLayer(WorldLayers.Enemies);
    this.tileset = this.world.getTileset();
    this.group = this.scene.add.group();

    this.mapLayer.objects.forEach((enemy: TiledGameObject) => {
      const tileProperties = this.scene.getTilesetProperties(enemy, this.tileset);

      switch (tileProperties.name) {
        case EnemyTypes.Liar:
          this.group.add(new Liar(this.scene, enemy.x, enemy.y));
          break;
        case EnemyTypes.Car:
          this.group.add(new Car(this.scene, enemy.x, enemy.y));
          break;
      }
    });
  }

  update(delta: number) {
    Array.from(this.group.children.entries).forEach((enemy: Enemy) => {
      enemy.update(delta);
    });
  }

  remove(enemy: Enemy) {
    this.group.remove(enemy);
  }

  overlapBrick(brick: BounceBrick) {
    Array.from(this.group.children.entries).forEach((enemy: Enemy) => {
      this.scene.physics.world.overlap(brick, enemy, () => {
        enemy.kill(true);
        enemy.updatePoints();
      });
    });
  }

  overlapCar(car: Car) {
    Array.from(this.group.children.entries).forEach((enemy: Enemy) => {
      if (car !== enemy) {
        this.scene.physics.world.overlap(car, enemy, () => car.slideKill(enemy));
      }
    });
  }

  overlapBible(bible: Bible) {
    Array.from(this.group.children.entries).forEach((enemy: Enemy) => {
      this.scene.physics.world.overlap(bible, enemy, () => {
        if (enemy.isAlive()) {
          bible.terminate();
          enemy.kill(true);
          enemy.updatePoints();
        }
      });
    });
  }
}
