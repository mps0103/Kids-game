import React, {useMemo, useRef, useState} from 'react';
import {Animated, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {Bouncy, PopIn, useShake} from '../components/ui';
import {createRng, starsFromMistakes} from '../core/rng';
import {sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genCount} from './gen';
import {Prompt, RoundDots} from './kit';

export default function CountTap({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const rounds = useMemo(() => genCount(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const jitter = useMemo(() => {
    const r = createRng(seed + 7);
    return Array.from({length: 64}, () => ({x: r.next() * 0.4 - 0.2, y: r.next() * 0.4 - 0.2, rot: r.int(-20, 20)}));
  }, [seed]);
  const {width, height} = useWindowDimensions();
  const [round, setRound] = useState(0);
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState(-1);
  const mistakes = useRef(0);
  const [shake, doShake] = useShake();
  const busy = useRef(false);
  const r = rounds[Math.min(round, rounds.length - 1)];
  const area = Math.min(width - 32, height * 0.45);
  const cell = area / r.grid;

  const answer = (v: number) => {
    if (busy.current) {
      return;
    }
    if (v === r.answer) {
      sfx('correct');
      busy.current = true;
      setTimeout(() => {
        busy.current = false;
        setTicked(new Set());
        setWrong(-1);
        if (round + 1 >= rounds.length) {
          onWin(starsFromMistakes(mistakes.current));
        } else {
          setRound(round + 1);
        }
      }, 600);
      setWrong(-2);
    } else {
      mistakes.current++;
      setWrong(v);
      doShake();
      onMistake();
    }
  };

  const toggle = (k: number) => {
    sfx('tap', 0.6);
    const t = new Set(ticked);
    if (t.has(k)) {
      t.delete(k);
    } else {
      t.add(k);
    }
    setTicked(t);
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>How many {r.target} can you see?</Prompt>
      <RoundDots total={rounds.length} done={round} />
      <PopIn key={round} style={[{width: area, height: area, backgroundColor: C.white, borderRadius: 24, marginTop: 6}, shadow]}>
        {r.items.map((it, k) => {
          const j = jitter[it.pos % jitter.length];
          const left = (it.pos % r.grid) * cell + j.x * cell;
          const top = Math.floor(it.pos / r.grid) * cell + j.y * cell;
          const on = ticked.has(k);
          return (
            <Pressable key={k} onPress={() => toggle(k)} style={{position: 'absolute', left, top, width: cell, height: cell, alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{fontSize: cell * (difficulty === 'expert' ? 0.55 : 0.68), transform: [{rotate: `${j.rot}deg`}], opacity: on ? 0.45 : 1}}>{it.e}</Text>
              {on ? <Text style={{position: 'absolute', fontSize: cell * 0.4, color: C.green, fontWeight: '900'}}>✓</Text> : null}
            </Pressable>
          );
        })}
      </PopIn>
      <Text style={{fontSize: 14, fontWeight: '800', color: C.inkSoft, marginTop: 8}}>Tip: tap pictures to tick them while you count</Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10}}>
        {r.options.map((v, i) => (
          <Bouncy key={v} sound={null} onPress={() => answer(v)} style={{margin: 7}}>
            <Animated.View style={[{width: 72, height: 72, borderRadius: 36, backgroundColor: wrong === -2 && v === r.answer ? C.green : CANDY[i % CANDY.length], alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.18)'}, shadow, wrong === v ? {transform: [{translateX: shake}], opacity: 0.5} : null]}>
              <Text style={{fontSize: 30, fontWeight: '900', color: C.white}}>{v}</Text>
            </Animated.View>
          </Bouncy>
        ))}
      </View>
    </View>
  );
}
