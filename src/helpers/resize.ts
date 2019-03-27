import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const resizeGame = () => {
  const canvas: HTMLCanvasElement = document.querySelector('canvas');
  const width: number = window.innerWidth;
  const height: number = window.innerHeight;
  const windowRatio: number = width / height;
  const gameRatio: number = GAME_WIDTH / GAME_HEIGHT;

  if (windowRatio < gameRatio) {
    canvas.parentElement.style.maxWidth = width + 'px';
    canvas.parentElement.style.maxHeight = width / gameRatio + 'px';
  } else {
    canvas.parentElement.style.maxWidth = height * gameRatio + 'px';
    canvas.parentElement.style.maxHeight = height + 'px';
  }
};
