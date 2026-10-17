import React, {useMemo, useRef, useState} from 'react';
import {Animated, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {useShake} from '../components/ui';
import {createRng, starsFromMistakes} from '../core/rng';
import {sfx} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genSpot} from './gen';
import {Prompt} from './kit';

export default function SpotDifference({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const data = useMemo(() => genSpot(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width, height} = useWindowDimensions();
  const cell = Math.min((width - 48) / data.cols, (height * 0.58) / (data.rows * 2) - 2);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<{side: number; i: number} | null>(null);
  const mistakes = useRef(0);
  const [shake, doShake] = useShake();
  const done = useRef(false);

  const tap = (side: number, i: number) => {
    if (done.current || found.has(i)) {
      return;
    }
    if (data.diffs.includes(i)) {
      sfx('correct');
      const f = new Set(found);
      f.add(i);
      setFound(f);
      if (f.size === data.diffs.length) {
        done.current = true;
        setTimeout(() => onWin(starsFromMistakes(mistakes.current)), 600);
      }
    } else {
      mistakes.current++;
      setWrong({side, i});
      doShake();
      onMistake();
    }
  };

  const grid = (side: number, items: string[], bg: string) => (
    <View style={[{flexDirection: 'row', flexWrap: 'wrap', width: data.cols * cell + 12, padding: 6, backgroundColor: bg, borderRadius: 18, marginVertical: 6}, shadow]}>
      {items.map((e, i) => {
        const isFound = found.has(i);
        const isWrong = wrong?.side === side && wrong.i === i;
        return (
          <Pressable key={i} onPress={() => tap(side, i)} style={{width: cell, height: cell, alignItems: 'center', justifyContent: 'center'}}>
            <Animated.View style={[{width: cell - 4, height: cell - 4, borderRadius: cell, alignItems: 'center', justifyContent: 'center', borderWidth: isFound || isWrong ? 3 : 0, borderColor: isFound ? C.green : C.red}, isWrong ? {transform: [{translateX: shake}]} : null]}>
              <Text style={{fontSize: cell * 0.58}}>{e}</Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>
        Find {data.diffs.length} difference{data.diffs.length > 1 ? 's' : ''} 🔎 ({found.size}/{data.diffs.length})
      </Prompt>
      {grid(0, data.left, '#E8F6FF')}
      {grid(1, data.right, '#FFF1E0')}
    </View>
  );
}
