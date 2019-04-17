import { PlayerStates, PowerUps, PowerUpTypes } from '@game/models';
import { GameScene } from '@game/scenes';

import { Bear } from './bear';
import { Butterfly } from './butterfly';
import { Candy } from './candy';
import { Flower } from './flower';
import { Robot } from './robot';
import { TileCandy } from './tile-candy';

export function createPowerUp(scene: GameScene, x: number, y: number, type: PowerUpTypes): PowerUps {
  if (scene.player && (type === PowerUpTypes.Bear || type === PowerUpTypes.Robot || type === PowerUpTypes.Flower)) {
    switch (scene.player.playerState) {
      case PlayerStates.Default:
        type = PowerUpTypes.Bear;
        break;
      case PlayerStates.Big:
        type = PowerUpTypes.Robot;
        break;
      case PlayerStates.Super:
        type = PowerUpTypes.Flower;
        break;
    }
  }

  switch (type) {
    case PowerUpTypes.Bear:
      return new Bear(scene, x, y);
    case PowerUpTypes.Robot:
      return new Robot(scene, x, y);
    case PowerUpTypes.Flower:
      return new Flower(scene, x, y);
    case PowerUpTypes.Butterfly:
      return new Butterfly(scene, x, y);
    case PowerUpTypes.TileCandy:
      return new TileCandy(scene, x, y);
    case PowerUpTypes.Candy:
      return new Candy(scene, x, y);
  }
}
