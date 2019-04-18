import { AUDIO_SPRITE_KEY, Sounds } from '@game/models';

import { GameScene } from './game-scene';

export enum MusicPlaylist {
  Song89 = '89',
  Bethel = 'bethel',
}

export const PLAYLIST: MusicPlaylist[] = [MusicPlaylist.Song89, MusicPlaylist.Bethel];

export class SoundEffects {
  private music: Phaser.Sound.BaseSound;

  constructor(private scene: GameScene) {
    this.playMusic();
  }

  private playMusic() {
    try {
      if (this.music) {
        this.music.stop();
        this.music.destroy();
      }

      (<any>this.scene.sound).sounds
        .filter((sound) => PLAYLIST.indexOf(sound.key) !== -1)
        .forEach((sound) => {
          sound.stop();
          sound.destroy();
        });

      this.music = this.scene.sound.add(this.scene.attractMode.isActive() ? MusicPlaylist.Bethel : MusicPlaylist.Song89);
      this.music.play('', { loop: true });
    } catch (e) {}
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

  playEffect(key: Sounds, onEnded: Function = () => {}) {
    const sound: any = this.scene.sound.addAudioSprite(AUDIO_SPRITE_KEY);

    sound.on('complete', () => {
      sound.destroy();
      onEnded();
    });

    sound.play(key);
  }

  setMusicRate(rate: number = 1) {
    if (this.music) {
      this.music.play('', { seek: 0, rate });
    }
  }
}
