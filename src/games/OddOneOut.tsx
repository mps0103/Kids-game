import React, {useMemo, useRef, useState} from 'react';
import {Animated, Text, useWindowDimensions, View} from 'react-native';
import {Bouncy, PopIn, useShake} from '../components/ui';
import {createRng, starsFromMistakes} from '../core/rng';
import {sfx} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genOdd} from './gen';
import {Prompt, RoundDots} from './kit';

export default function OddOneOut({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const rounds = useMemo(() => genOdd(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width, height} = useWindowDimensions();
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState(-1);
  const [found, setFound] = useState(false);
  const mistakes = useRef(0);
  const [shake, doShake] = useShake();
  const r = rounds[Math.min(round, rounds.length - 1)];
  const rows = Math.ceil(r.items.length / r.cols);
  const size = Math.min((width - 40) / r.cols - 10, (height * 0.55) / rows - 10, 110);

  const tap = (i: number) => {
    if (found) {
      return;
    }
    if (i === r.odd) {
      sfx('correct');
      setFound(true);
      setTimeout(() => {
        setFound(false);
        setWrong(-1);
        if (round + 1 >= rounds.length) {
          onWin(starsFromMistakes(mistakes.current));
        } else {
          setRound(round + 1);
        }
      }, 700);
    } else {
      mistakes.current++;
      setWrong(i);
      doShake();
      onMistake();
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>Tap the one that is different! 🔍</Prompt>
      <RoundDots total={rounds.length} done={round} />
      <PopIn key={round} style={{flexDirection: 'row', flexWrap: 'wrap', width: r.cols * (size + 10), justifyContent: 'center', marginTop: 12}}>
        {r.items.map((e, i) => {
          const isOdd = i === r.odd;
          const highlight = found && isOdd;
          return (
            <Bouncy key={i} sound={null} onPress={() => tap(i)} style={{margin: 5}}>
              <Animated.View
                style={[
                  {width: size, height: size, borderRadius: size * 0.22, backgroundColor: highlight ? '#E6FFF1' : C.white, borderWidth: 3, borderColor: highlight ? C.green : wrong === i ? C.red : 'transparent', alignItems: 'center', justifyContent: 'center'},
                  shadow,
                  wrong === i ? {transform: [{translateX: shake}]} : null,
                ]}>
                <Text style={{fontSize: size * 0.58, transform: isOdd && r.rotateOdd ? [{rotate: '180deg'}] : []}}>{e}</Text>
              </Animated.View>
            </Bouncy>
          );
        })}
      </PopIn>
    </View>
  );
}
