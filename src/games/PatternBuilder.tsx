import React, {useMemo, useRef, useState} from 'react';
import {Animated, Text, useWindowDimensions, View} from 'react-native';
import {Bouncy, PopIn, useShake} from '../components/ui';
import {createRng, starsFromMistakes} from '../core/rng';
import {sfx} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genPattern} from './gen';
import {Prompt, RoundDots} from './kit';

export default function PatternBuilder({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const rounds = useMemo(() => genPattern(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width} = useWindowDimensions();
  const [round, setRound] = useState(0);
  const [filled, setFilled] = useState(0); // how many blanks done in this round
  const mistakes = useRef(0);
  const [shake, doShake] = useShake();
  const r = rounds[Math.min(round, rounds.length - 1)];
  const perRow = Math.min(r.seq.length, 6);
  const size = Math.min((width - 40) / perRow - 8, 64);
  const busy = useRef(false);

  const choose = (e: string) => {
    if (busy.current) {
      return;
    }
    const target = r.seq[r.blanks[filled]];
    if (e === target) {
      sfx('correct');
      const f = filled + 1;
      setFilled(f);
      if (f >= r.blanks.length) {
        busy.current = true;
        setTimeout(() => {
          busy.current = false;
          setFilled(0);
          if (round + 1 >= rounds.length) {
            onWin(starsFromMistakes(mistakes.current));
          } else {
            setRound(round + 1);
          }
        }, 700);
      }
    } else {
      mistakes.current++;
      doShake();
      onMistake();
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>What comes next? Finish the pattern 🧠</Prompt>
      <RoundDots total={rounds.length} done={round} />
      <PopIn key={round} style={[{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: C.white, borderRadius: 24, padding: 12, margin: 14, width: width - 32}, shadow]}>
        {r.seq.map((e, i) => {
          const bi = r.blanks.indexOf(i);
          const isBlank = bi >= 0 && bi >= filled;
          const isCurrent = bi === filled;
          return (
            <Animated.View
              key={i}
              style={[
                {width: size, height: size, margin: 4, borderRadius: size * 0.25, alignItems: 'center', justifyContent: 'center', backgroundColor: isBlank ? '#F3EEFF' : bi >= 0 ? '#E6FFF1' : 'transparent', borderWidth: isBlank ? 3 : 0, borderStyle: 'dashed', borderColor: isCurrent ? C.purple : C.grey},
                isCurrent ? {transform: [{translateX: shake}]} : null,
              ]}>
              <Text style={{fontSize: size * 0.6, fontWeight: '900', color: C.purple}}>{isBlank ? '?' : e}</Text>
            </Animated.View>
          );
        })}
      </PopIn>
      <Text style={{fontSize: 16, fontWeight: '800', color: C.inkSoft, marginTop: 8}}>Pick the answer 👇</Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12}}>
        {r.options.map(o => (
          <Bouncy key={o} sound={null} onPress={() => choose(o)} style={[{width: 84, height: 84, margin: 8, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderBottomColor: C.grey}, shadow]}>
            <Text style={{fontSize: 46}}>{o}</Text>
          </Bouncy>
        ))}
      </View>
    </View>
  );
}
