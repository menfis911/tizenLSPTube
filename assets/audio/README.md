# AAC compatibility fixtures

Original synthetic 20-second two-tone signal (330/440 Hz), created for this project. No speech, music recording or third-party audio is included. AAC-LC, 48 kHz, mono, 64 kbit/s. Files are copied into packages/launcher/service/dist for offline playback from the existing local service; FFmpeg is only a development tool and is not installed on the projector.

Reproduce with FFmpeg:

```
ffmpeg -f lavfi -i 'aevalsrc=0.05*sin(2*PI*330*t)+0.05*sin(2*PI*440*t):s=48000:d=20' -af 'afade=t=in:d=0.15,afade=t=out:st=19.7:d=0.3' -c:a aac -profile:a aac_low -b:a 64k -flags:a +bitexact -fflags +bitexact -movflags +faststart -y aac-test.mp4
ffmpeg -i aac-test.mp4 -c:a copy -movflags +empty_moov+default_base_moof -frag_duration 1000000 -fflags +bitexact -y aac-test-fragmented.mp4
```

## Single-player replacement presets

`aac-replace-{44100,48000}-{1,2}.mp4` contain 60 seconds of the same original synthetic tone, at each sample rate/channel configuration. Generate from `aevalsrc=0.10*sin(2*PI*330*t)+0.10*sin(2*PI*440*t):s=RATE:d=60`, with `-ac CHANNELS -c:a aac -profile:a aac_low -b:a 64k -flags:a +bitexact -fflags +bitexact -movflags +empty_moov+default_base_moof -frag_duration 1000000`. These are compatibility fixtures, not translated speech or a runtime encoder.
