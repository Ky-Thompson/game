import { AUDIO_SPRITE_KEY, Sounds } from '@game/models';

import { GameScene } from './game-scene';

enum MusicPlaylist {
  Song89 = '89',
  Bethel = 'bethel',
}

const PLAYLIST: MusicPlaylist[] = [MusicPlaylist.Song89, MusicPlaylist.Bethel];

const DEMO_VOLUME: number = 0.3;
const GAME_VOLUME: number = 1;

export class SoundEffects {
  private music: Phaser.Sound.BaseSound;
  private static lastMusic: MusicPlaylist;

  constructor(private scene: GameScene) {
    this.playMusic();
  }

  private playMusic() {
    try {
      if (this.music) {
        this.music.stop();
        this.music.destroy();
      }

      let musicKey: MusicPlaylist;

      if (this.scene.isScoreboardActive()) {
        musicKey = MusicPlaylist.Bethel;
      } else if (this.scene.demo.isActive()) {
        musicKey = MusicPlaylist.Bethel;
      } else {
        musicKey = MusicPlaylist.Song89;
      }

      const currentMusic: Phaser.Sound.BaseSound = (<any>this.scene.sound).sounds.filter((sound) => PLAYLIST.indexOf(sound.key) !== -1)[0];
      const isPlaying: boolean = musicKey === SoundEffects.lastMusic && currentMusic && musicKey === currentMusic.key;

      if (isPlaying) {
        this.music = currentMusic;
      } else {
        if (currentMusic) {
          currentMusic.stop();
          currentMusic.destroy();
        }

        SoundEffects.lastMusic = musicKey;
        this.music = this.scene.sound.add(musicKey, { loop: true });
        this.music.play('');
      }
    } catch (e) {}

    this.scene.sound.volume = this.scene.demo.isActive() ? DEMO_VOLUME : GAME_VOLUME;
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

    sound.on(Phaser.Sound.Events.COMPLETE, () => {
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
