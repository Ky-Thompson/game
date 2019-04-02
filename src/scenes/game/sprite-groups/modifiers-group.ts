import { TILE_SIZE } from '@game/config';
import { Modifiers, PipeDestination, PipeDestinations, PipeDirection, TiledGameObject } from '@game/models';

import { GameScene } from '../scene';
import { World, WorldLayers } from './world';

export class ModifierGroup {
  private readonly mapLayer: Phaser.Tilemaps.ObjectLayer;
  private readonly destinations: PipeDestinations = {};

  private finishLine: TiledGameObject;
  private start: TiledGameObject;

  constructor(private scene: GameScene, private world: World) {
    this.mapLayer = this.world.getLayer(WorldLayers.Modifiers);

    this.mapLayer.objects.forEach((modifier: TiledGameObject) => {
      this.consolidateProperties(modifier);
      const type: Modifiers = modifier.properties.type;

      switch (type) {
        case Modifiers.Pipe:
          this.processPipe(modifier);
          break;
        case Modifiers.Destination:
          this.processDestination(modifier);
          break;
        case Modifiers.Room:
          this.processRoom(modifier);
          break;
        case Modifiers.FinishLine:
          this.finishLine = modifier;
          break;
        case Modifiers.Start:
          this.start = modifier;
          break;
      }
    });
  }

  private processPipe(modifier: TiledGameObject) {
    // Adds info on where to go from a pipe under the modifier
    for (let x = 0; x < modifier.width / TILE_SIZE; x++) {
      for (let y = 0; y < modifier.height / TILE_SIZE; y++) {
        const tile: TiledGameObject = <any>this.world.getTileAt(modifier.x / TILE_SIZE + x, modifier.y / TILE_SIZE + y);
        tile.properties.goto = modifier.properties.goto;
        tile.properties.direction = modifier.properties.direction;
        tile.properties.pipe = true;
      }
    }
  }

  private processDestination(modifier: TiledGameObject) {
    const pipeId: number = modifier.properties.pipeId;
    const direction: PipeDirection = modifier.properties.direction;

    // Calculate coordinates where the player should appear
    let x: number = 0;
    let y: number = 0;

    switch (direction) {
      case PipeDirection.Right:
        x = modifier.width;
        y = modifier.height / 2;
        break;
      case PipeDirection.Left:
        x = 0;
        y = modifier.height / 2;
        break;
      case PipeDirection.Up:
        x = modifier.width / 2;
        y = 0;
        break;
      case PipeDirection.Down:
        x = modifier.width / 2;
        y = -modifier.height;
        break;
    }

    // Adds a destination so that a pipe can find it
    this.destinations[pipeId] = {
      x: modifier.x + x,
      y: modifier.y + y,
      top: modifier.y < TILE_SIZE,
      direction: direction,
    };
  }

  private processRoom(modifier: TiledGameObject) {
    // Adds a 'room' that is just info on bounds so that we can add sections below pipes
    // in an level just using one tilemap.
    this.scene.world.addRoom({
      x: modifier.x,
      width: modifier.width,
      backgroundColor: modifier.properties.backgroundColor,
    });
  }

  private consolidateProperties(tile: TiledGameObject) {
    if (Array.isArray(tile.properties)) {
      const properties = {};
      tile.properties.forEach((prop) => {
        properties[prop.name] = prop.value;
      });
      tile.properties = properties;
    }
  }

  getDestination(id: number): PipeDestination {
    return this.destinations[id];
  }

  getFinishLine(): TiledGameObject {
    return this.finishLine;
  }

  getStart(): TiledGameObject {
    return this.start;
  }
}
