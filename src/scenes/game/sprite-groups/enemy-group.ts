import { TiledGameObject } from '../../../models';
import { BounceBrick, Enemy, Fireball } from '../../../sprites';
import { Goomba } from '../../../sprites/goomba';
import { Turtle } from '../../../sprites/turtle';
import { GameScene } from '../scene';
import { World, WorldLayers } from '../sprite-groups';

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
        case 'goomba': // TODO: Refactor sprite to be generic
          this.group.add(new Goomba(this.scene, enemy.x, enemy.y));
          break;
        case 'turtle':
          this.group.add(new Turtle(this.scene, enemy.x, enemy.y));
          break;
      }
    });
  }

  update(time: number, delta: number) {
    Array.from(this.group.children.entries).forEach((enemy: Enemy) => {
      enemy.update(time, delta);
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

  overlapTurtle(turtle: Turtle) {
    Array.from(this.group.children.entries).forEach((enemy: Enemy) => {
      if (turtle !== enemy) {
        this.scene.physics.world.overlap(turtle, enemy, () => turtle.slideKill(enemy));
      }
    });
  }

  overlapFire(fire: Fireball) {
    Array.from(this.group.children.entries).forEach((enemy: Enemy) => {
      this.scene.physics.world.overlap(fire, enemy, () => {
        fire.explode();
        enemy.kill(true);
        enemy.updatePoints();
      });
    });
  }
}
