// Graphics
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
export const TILE_SIZE = 32;
export const FONT = 'font';

// Game
export const GRAVITY = 1600;
export const GAME_TIMEOUT = 150;
export const MS_TO_S = 1000;
export const HURRY_TIME = 50;
export const TIME_FACTOR = 2;
export const SUNSET_DURATION = (GAME_TIMEOUT * MS_TO_S) / (TIME_FACTOR * 4);

// Browser
export const IPAD_PRO_WIDTH = 1200;
export const IPAD_PRO_HEIGHT = 900;

export const IS_ANDROID: boolean = !!navigator.userAgent.match(/Android/i);
export const IS_IOS: boolean = !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
export const IS_IPADOS: boolean =
  navigator.userAgent.match(/Safari/i) &&
  !navigator.userAgent.match(/Chrome/i) &&
  navigator.platform.match(/MacIntel/i) &&
  window.innerWidth <= IPAD_PRO_WIDTH &&
  window.innerHeight <= IPAD_PRO_HEIGHT;

export const IS_MOBILE = IS_ANDROID || IS_IOS || IS_IPADOS;

export const IS_STANDALONE: boolean = 'standalone' in navigator && !!(navigator as any).standalone;
