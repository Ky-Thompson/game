import { GameScene } from './game-scene';

export enum MusicPlaylist {
  Song89 = '89',
}

export class SoundEffects {
  private music: Phaser.Sound.BaseSound;

  constructor(private scene: GameScene) {
    this.init();
  }

  private init() {
    if (!this.scene.attractMode.isActive()) {
      try {
        this.music = this.scene.sound.add(MusicPlaylist.Song89);
        this.music.play({ loop: true });
      } catch (e) {}
    }
  }

  pauseMusic() {
    if (this.music) {
      this.music.pause();
    }
  }

  resumeMusic() {
    if (this.music) {
      this.music.resume();
    }
  }

  // TODO: Use enum
  playEffect(key: string, pauseMusic: boolean = false) {
    const sound = this.scene.sound.addAudioSprite('sfx');

    if (pauseMusic) {
      this.pauseMusic();
    }

    (<any>sound).on('ended', (sound) => {
      if (pauseMusic) {
        this.resumeMusic();
      }
      sound.destroy();
    });

    (<any>sound).play(key);
  }

  setMusicRate(rate: number) {
    if (this.music) {
      (<any>this.music).seek = 0;
      (<any>this.music).rate = rate;
    }
  }
}
