import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '@game/config';

const RESIZE_DEFINITION = TILE_SIZE / 2;

export const resizeGame = () => {
  const canvas: HTMLCanvasElement = document.querySelector('canvas');
  const windowWidth: number = window.innerWidth;
  const windowHeight: number = window.innerHeight;
  const windowRatio: number = windowWidth / windowHeight;
  const gameRatio: number = GAME_WIDTH / GAME_HEIGHT;

  let width: number;
  let height: number;

  // Calculate ratio
  if (windowRatio < gameRatio) {
    width = windowWidth;
    height = windowWidth / gameRatio;

    canvas.parentElement.style.maxWidth = windowWidth + 'px';
    canvas.parentElement.style.maxHeight = windowWidth / gameRatio + 'px';
  } else {
    width = windowHeight * gameRatio;
    height = windowHeight;
  }

  // Floor to tile size
  width = Math.floor(width / RESIZE_DEFINITION) * RESIZE_DEFINITION;
  height = Math.floor(height / RESIZE_DEFINITION) * RESIZE_DEFINITION;

  canvas.parentElement.style.maxWidth = width + 'px';
  canvas.parentElement.style.maxHeight = height + 'px';
};
