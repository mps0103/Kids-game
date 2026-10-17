import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {createRng, starsFromMistakes} from '../core/rng';
import {note} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genSimon} from './gen';
import {Prompt, RoundDots} from './kit';

const PADS = [
  {c: '#FF5A5F', e: '🍓'},
  {c: '#3FA9F5', e: '🫐'},
  {c: '#2ECC71', e: '🍏'},
  {c: '#FFD23F', e: '🍋'},
  {c: '#9B5CFF', e: '🍇'},
  {c: '#FF9A3C', e: '🍊'},
];

function Pad({i, lit, size, onPress, disabled}: {i: number; lit: boolean; size: number; onPress: () => void; disabled: boolean}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {toValue: lit ? 1 : 0, duration: 120, useNativeDriver: true}).start();
  }, [lit, v]);
  const scale = v.interpolate({inputRange: [0, 1], outputRange: [1, 1.12]});
  const op = v.interpolate({inputRange: [0, 1], outputRange: [0.45, 1]});
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{margin: 8}}>
      <Animated.View style={[{width: size, height: size, borderRadius: size * 0.28, backgroundColor: PADS[i].c, alignItems: 'center', justifyContent: 'center', opacity: op, transform: [{scale}]}, shadow]}>
        <Text style={{fontSize: size * 0.42}}>{PADS[i].e}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function SimonColours({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const data = useMemo(() => genSimon(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width} = useWindowDimensions();
  const cols = data.pads === 4 ? 2 : 3;
  const size = Math.min((width - 40) / cols - 16, 140);
  const [lit, setLit] = useState(-1);
  const [phase, setPhase] = useState<'watch' | 'play'>('watch');
  const [step, setStep] = useState(0);
  const mistakes = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const playSeq = useCallback(() => {
    setPhase('watch');
    setStep(0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    data.seq.forEach((p, k) => {
      const t0 = 700 + k * data.speed * 1.4;
      timers.current.push(
        setTimeout(() => {
          setLit(p);
          note(p);
        }, t0),
      );
      timers.current.push(setTimeout(() => setLit(-1), t0 + data.speed));
    });
    timers.current.push(setTimeout(() => setPhase('play'), 700 + data.seq.length * data.speed * 1.4));
  }, [data]);

  useEffect(() => {
    playSeq();
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, [playSeq]);

  const tap = (i: number) => {
    if (phase !== 'play') {
      return;
    }
    setLit(i);
    setTimeout(() => setLit(-1), 180);
    if (data.seq[step] === i) {
      note(i);
      const s = step + 1;
      setStep(s);
      if (s === data.seq.length) {
        setPhase('watch');
        setTimeout(() => onWin(starsFromMistakes(mistakes.current, 1)), 300);
      }
    } else {
      mistakes.current++;
      onMistake();
      setTimeout(playSeq, 600);
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>{phase === 'watch' ? 'Watch carefully… 👀' : 'Your turn! Tap in order 👆'}</Prompt>
      <RoundDots total={data.seq.length} done={phase === 'play' ? step : 0} />
      <View style={{flexDirection: 'row', flexWrap: 'wrap', width: cols * (size + 16), justifyContent: 'center', marginTop: 16}}>
        {Array.from({length: data.pads}, (_, i) => (
          <Pad key={i} i={i} lit={lit === i} size={size} disabled={phase !== 'play'} onPress={() => tap(i)} />
        ))}
      </View>
      <Text style={{marginTop: 12, fontSize: 15, fontWeight: '800', color: C.inkSoft}}>{data.seq.length} steps to remember</Text>
    </View>
  );
}
