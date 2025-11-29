import { Howl, Howler } from 'howler';

class AudioManager {
    private sounds: Record<string, Howl> = {};
    private music: Howl | null = null;

    constructor() {
        // Preload SFX
        /*
        this.sounds['jump'] = new Howl({ src: [Assets.Audio.jump], volume: 0.5 });
        this.sounds['collect'] = new Howl({ src: [Assets.Audio.collect], volume: 0.5 });
        this.sounds['click'] = new Howl({ src: [Assets.Audio.click], volume: 0.5 });

        // Setup Music (lazy load or preload)
        this.music = new Howl({
            src: [Assets.Audio.bgm],
            html5: true, // Stream for larger files
            loop: true,
            volume: 0.3
        });
        */
    }

    play(name: string) {
        if (this.sounds[name]) {
            this.sounds[name].play();
        } else {
            console.warn(`Sound ${name} not found`);
        }
    }

    playMusic() {
        if (this.music && !this.music.playing()) {
            this.music.play();
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.stop();
        }
    }

    setVolume(volume: number) {
        Howler.volume(volume);
    }
}

export const audioManager = new AudioManager();
