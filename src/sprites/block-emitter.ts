import { SPRITES_KEY } from '@game/animations';
import { GameScene } from '@game/scenes';

enum BlockEmitterAnimations {
  Brick = 'brick',
}

const BLOCK_EMITTER_GRAVITY = 3000;
const BLOCK_EMITTER_LIFE_SPAN = 2000;
const BLOCK_EMITTER_SPEED = 800;
const BLOCK_EMITTER_ANGLE_MIN = -90 - 25;
const BLOCK_EMITTER_ANGLE_MAX = -45 - 25;
const BLOCK_EMITTER_PARTICLES = 6;

export class BlockEmitter {
  private particles: Phaser.GameObjects.Particles.ParticleEmitterManager;

  constructor(private scene: GameScene) {
    this.init();
  }

  private init() {
    this.particles = this.scene.add.particles(SPRITES_KEY);
    this.particles.createEmitter({
      frames: [BlockEmitterAnimations.Brick],
      gravityY: BLOCK_EMITTER_GRAVITY,
      lifespan: BLOCK_EMITTER_LIFE_SPAN,
      speed: BLOCK_EMITTER_SPEED,
      angle: { min: BLOCK_EMITTER_ANGLE_MIN, max: BLOCK_EMITTER_ANGLE_MAX },
      frequency: -1,
    });
  }

  emit(x: number, y: number) {
    this.particles.emitParticle(BLOCK_EMITTER_PARTICLES, x, y);
  }
}
