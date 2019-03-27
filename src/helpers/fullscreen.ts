let fullscreenRequested: boolean = false;

export const setFullscreen = async () => {
  if (fullscreenRequested) {
    return;
  }

  fullscreenRequested = true;

  const gameContainerElement: any = document.getElementById('game-container');
  gameContainerElement.removeEventListener('click', setFullscreen);
  gameContainerElement.removeEventListener('touchstart', setFullscreen);

  var requestFullScreen: () => Promise<void> =
    gameContainerElement.requestFullscreen ||
    gameContainerElement.mozRequestFullScreen ||
    gameContainerElement.webkitRequestFullScreen ||
    gameContainerElement.msRequestFullscreen ||
    gameContainerElement.webkitEnterFullscreen;

  try {
    await requestFullScreen.call(gameContainerElement);
  } catch (e) {}

  window.scrollTo(0, 1);
};
