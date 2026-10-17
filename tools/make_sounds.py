"""Generates all of the app's original sound effects and music loops.

Everything here is synthesised from scratch (no samples, no copyrighted tunes).
Run:  python tools/make_sounds.py   (needs numpy + ffmpeg)
Output: android/app/src/main/res/raw/*.ogg
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res', 'raw')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def hz(name):
    n, octv = name[:-1], int(name[-1])
    midi = 12 * (octv + 1) + NOTE[n]
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def env(t, attack=0.004, decay=6.0):
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t * decay)


def marimba(f, sec=0.6, vol=1.0):
    t = t_axis(sec)
    s = np.sin(2 * np.pi * f * t) * env(t, 0.003, 7)
    s += 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * env(t, 0.002, 30)
    s += 0.12 * np.sin(2 * np.pi * f * 2 * t) * env(t, 0.003, 12)
    return vol * s


def bell(f, sec=1.0, vol=1.0):
    t = t_axis(sec)
    s = np.sin(2 * np.pi * f * t) * env(t, 0.002, 3.5)
    s += 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * env(t, 0.002, 7)
    s += 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * env(t, 0.002, 12)
    return vol * s


def pluck(f, sec=0.35, vol=1.0):
    t = t_axis(sec)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)
    return vol * s * env(t, 0.003, 11)


def bass(f, sec=0.4, vol=1.0):
    t = t_axis(sec)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    e = np.clip(t / 0.005, 0, 1) * np.exp(-t * 4) * np.clip((sec - t) / 0.03, 0, 1)
    return vol * s * e


def kick(vol=1.0):
    t = t_axis(0.25)
    f = 50 + 90 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return vol * np.sin(ph) * np.exp(-t * 14)


def hat(vol=1.0, sec=0.05):
    t = t_axis(sec)
    n = rng.standard_normal(len(t))
    n = np.diff(np.concatenate([[0], n]))  # crude high-pass
    return vol * 0.3 * n * np.exp(-t * 70)


def shaker(vol=1.0):
    t = t_axis(0.08)
    n = rng.standard_normal(len(t))
    n = np.diff(np.concatenate([[0], n]))
    e = np.sin(np.pi * np.clip(t / 0.08, 0, 1)) ** 2
    return vol * 0.18 * n * e


def mix_into(buf, sig, at_sec):
    i = int(at_sec * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i]


def normalize(x, peak=0.89):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def soft_clip(x):
    return np.tanh(x * 1.1) / np.tanh(1.1)


def save(name, x, quality=4):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        path = tmp.name
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    out = os.path.join(OUT, f'{name}.ogg')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-c:a', 'libvorbis', '-q:a', str(quality), out], check=True)
    os.remove(path)
    print('wrote', out, f'{len(x) / SR:.2f}s')


# ---------------- Sound effects ----------------
def sfx():
    # tap: soft rising blip
    t = t_axis(0.07)
    f = 700 + 500 * (t / 0.07)
    save('sfx_tap', normalize(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.002, 45), 0.55))

    # pop: balloon pop
    t = t_axis(0.18)
    n = rng.standard_normal(len(t)) * np.exp(-t * 60)
    f = 900 * np.exp(-t * 18) + 150
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25)
    save('sfx_pop', normalize(0.6 * n + tone, 0.8))

    # correct: happy two-note ding
    b = np.zeros(int(SR * 0.7))
    mix_into(b, bell(hz('E6'), 0.6), 0)
    mix_into(b, bell(hz('A6'), 0.6), 0.09)
    save('sfx_correct', normalize(b, 0.75))

    # wrong: gentle cartoon "boing" (not scary)
    t = t_axis(0.42)
    f = 330 - 140 * (t / 0.42) + 18 * np.sin(2 * np.pi * 14 * t)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.01, 5)
    s += 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * env(t, 0.01, 8)
    save('sfx_wrong', normalize(s, 0.6))

    # win: rising fanfare + sparkle chord
    b = np.zeros(int(SR * 1.8))
    for k, nm in enumerate(['C5', 'E5', 'G5', 'C6', 'E6']):
        mix_into(b, marimba(hz(nm), 0.5), k * 0.075)
    for nm in ['C6', 'E6', 'G6', 'C7']:
        mix_into(b, bell(hz(nm), 1.3, 0.5), 0.4)
    for k in range(8):
        mix_into(b, bell(hz('C7') * (1 + 0.5 * rng.random()), 0.3, 0.15), 0.45 + k * 0.08)
    save('sfx_win', normalize(soft_clip(b), 0.85))

    # star: sparkly chime
    b = np.zeros(int(SR * 0.8))
    mix_into(b, bell(hz('G6'), 0.7), 0)
    for k in range(5):
        mix_into(b, bell(hz('D7') * (1 + 0.3 * rng.random()), 0.25, 0.25), 0.05 + k * 0.05)
    save('sfx_star', normalize(b, 0.7))

    # flip: card swish
    t = t_axis(0.14)
    n = rng.standard_normal(len(t))
    n = np.convolve(n, np.ones(6) / 6, mode='same')
    e = np.sin(np.pi * t / 0.14) ** 2
    save('sfx_flip', normalize(n * e, 0.45))

    # magic: shimmering upward glissando (gift / unlock)
    b = np.zeros(int(SR * 1.4))
    scale = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7', 'G7', 'A7']
    for k, nm in enumerate(scale):
        mix_into(b, bell(hz(nm), 0.7, 0.6), k * 0.055)
    save('sfx_magic', normalize(b, 0.75))

    # swoosh: slide whistle (maze moves)
    t = t_axis(0.2)
    f = 500 + 500 * (t / 0.2) ** 0.7
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.2)
    save('sfx_swoosh', normalize(s, 0.4))

    # notes for Simon pads and Spell It letters (C major pentatonic)
    for k, nm in enumerate(['C5', 'D5', 'E5', 'G5', 'A5', 'C6']):
        save(f'note_{k}', normalize(marimba(hz(nm), 0.7), 0.7))


# ---------------- Music loops ----------------
def loop_render(total_sec, events):
    """events: list of (start_sec, signal). Tails past the end wrap to the start for a seamless loop."""
    n = int(SR * total_sec)
    buf = np.zeros(n + SR * 3)
    for at, sig in events:
        mix_into(buf, sig, at)
    out = buf[:n].copy()
    tail = buf[n:]
    out[: len(tail)] += tail[: n]
    return out


CHORDS = {
    'C': ['C', 'E', 'G'],
    'Am': ['A', 'C', 'E'],
    'F': ['F', 'A', 'C'],
    'G': ['G', 'B', 'D'],
    'Dm': ['D', 'F', 'A'],
    'Em': ['E', 'G', 'B'],
}


def menu_music():
    bpm = 118
    beat = 60 / bpm
    e8 = beat / 2
    prog = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C']
    _ = None
    mel = [
        ['E5', _, 'G5', _, 'C6', _, 'G5', 'E5'],
        ['A5', _, 'G5', _, 'E5', _, 'C5', _],
        ['F5', _, 'A5', _, 'C6', _, 'A5', 'F5'],
        ['G5', _, 'B5', _, 'D6', _, 'B5', 'G5'],
        ['E5', 'G5', 'C6', _, 'E6', _, 'D6', 'C6'],
        ['A5', _, 'C6', _, 'A5', 'G5', 'E5', _],
        ['F5', 'A5', 'C6', 'A5', 'G5', _, 'F5', 'E5'],
        ['D5', _, 'G5', _, 'B5', _, _, _],
        ['A5', _, 'A5', 'C6', 'A5', _, 'F5', _],
        ['B5', _, 'B5', 'D6', 'B5', _, 'G5', _],
        ['G5', _, 'E5', 'G5', 'B5', _, 'G5', _],
        ['C6', _, 'A5', _, 'E5', _, 'A5', _],
        ['A5', 'G5', 'F5', _, 'A5', _, 'C6', _],
        ['B5', 'A5', 'G5', _, 'D6', _, 'B5', _],
        ['C6', _, 'G5', _, 'E5', _, 'G5', _],
        ['C6', _, _, _, _, _, _, _],
    ]
    events = []
    for bar, ch in enumerate(prog):
        b0 = bar * 4 * beat
        notes = CHORDS[ch]
        root = notes[0]
        # bouncy bass
        for k, (step, octv) in enumerate([(0, 2), (1, 3), (2, 2), (3, 3)]):
            events.append((b0 + step * beat, bass(hz(f'{root}{octv}'), beat * 0.9, 0.55 if k % 2 == 0 else 0.35)))
        # off-beat chord plucks (ukulele feel)
        for step in range(4):
            for nm in notes:
                events.append((b0 + step * beat + e8, pluck(hz(f'{nm}4'), 0.25, 0.10)))
        # melody
        for k, nm in enumerate(mel[bar]):
            if nm:
                events.append((b0 + k * e8, marimba(hz(nm), 0.5, 0.42)))
        # drums
        for step in range(4):
            if step in (0, 2):
                events.append((b0 + step * beat, kick(0.55)))
            events.append((b0 + step * beat + e8, hat(0.45)))
            events.append((b0 + step * beat, shaker(0.5)))
        if bar % 4 == 3:
            for k in range(4):
                events.append((b0 + 3 * beat + k * beat / 4, hat(0.35)))
    total = len(prog) * 4 * beat
    out = loop_render(total, events)
    save('music_menu', normalize(soft_clip(out), 0.8), quality=3)


def game_music():
    bpm = 96
    beat = 60 / bpm
    e8 = beat / 2
    prog = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Em', 'F', 'C', 'Dm', 'G', 'C', 'C']
    events = []
    patt = [0, 1, 2, 3, 2, 1, 2, 1]  # arpeggio shape over chord tones (+ octave)
    melody = {0: 'G5', 2: 'D6', 4: 'C6', 6: 'B5', 8: 'C6', 9: 'B5', 10: 'A5', 11: 'G5', 12: 'F5', 13: 'G5', 14: 'E5'}
    for bar, ch in enumerate(prog):
        b0 = bar * 4 * beat
        notes = CHORDS[ch]
        tones = [f'{notes[0]}4', f'{notes[1]}4', f'{notes[2]}4', f'{notes[0]}5']
        for k, idx in enumerate(patt):
            events.append((b0 + k * e8, bell(hz(tones[idx]), 0.9, 0.16)))
        events.append((b0, bass(hz(f'{notes[0]}2'), beat * 3.6, 0.35)))
        if bar in melody:
            events.append((b0 + beat, bell(hz(melody[bar]), 1.8, 0.28)))
        for step in range(4):
            events.append((b0 + step * beat + e8, shaker(0.25)))
    total = len(prog) * 4 * beat
    out = loop_render(total, events)
    save('music_game', normalize(soft_clip(out), 0.7), quality=3)


if __name__ == '__main__':
    sfx()
    menu_music()
    game_music()
