import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {createRng} from '../core/rng';
import {sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genMemory} from './gen';
import {Prompt} from './kit';

function Card({face, open, matched, size, color, onPress}: {face: string; open: boolean; matched: boolean; size: number; color: string; onPress: () => void}) {
  const v = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, {toValue: open ? 1 : 0, useNativeDriver: true, friction: 7}).start();
  }, [open, v]);
  const back = v.interpolate({inputRange: [0, 0.5, 1], outputRange: [1, 0, 0]});
  const front = v.interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 0, 1]});
  const rot = v.interpolate({inputRange: [0, 1], outputRange: ['0deg', '180deg']});
  const rotF = v.interpolate({inputRange: [0, 1], outputRange: ['180deg', '360deg']});
  const base = {width: size, height: size, borderRadius: size * 0.2, position: 'absolute' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backfaceVisibility: 'hidden' as const};
  return (
    <Pressable onPress={onPress} style={{width: size, height: size, margin: 5}}>
      <Animated.View style={[base, shadow, {backgroundColor: color, opacity: back, transform: [{perspective: 600}, {rotateY: rot}]}]}>
        <Text style={{fontSize: size * 0.4, color: C.white, fontWeight: '900'}}>?</Text>
      </Animated.View>
      <Animated.View style={[base, shadow, {backgroundColor: matched ? '#E6FFF1' : C.white, borderWidth: 3, borderColor: matched ? C.green : C.grey, opacity: front, transform: [{perspective: 600}, {rotateY: rotF}]}]}>
        <Text style={{fontSize: size * 0.55}}>{face}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function MemoryMatch({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const data = useMemo(() => genMemory(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width, height} = useWindowDimensions();
  const rows = Math.ceil(data.cards.length / data.cols);
  const size = Math.min((width - 32) / data.cols - 10, (height * 0.6) / rows - 10, 110);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState(data.previewMs > 0);
  const misses = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    if (data.previewMs > 0) {
      const t = setTimeout(() => setPreview(false), data.previewMs);
      return () => clearTimeout(t);
    }
  }, [data.previewMs]);

  const tap = (i: number) => {
    if (preview || busy.current || matched.has(i) || open.includes(i)) {
      return;
    }
    sfx('flip');
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      busy.current = true;
      const [a, b] = next;
      if (data.cards[a] === data.cards[b]) {
        setTimeout(() => {
          sfx('correct');
          const m = new Set(matched);
          m.add(a);
          m.add(b);
          setMatched(m);
          setOpen([]);
          busy.current = false;
          if (m.size === data.cards.length) {
            const x = misses.current;
            onWin(x <= data.pairs * 0.5 ? 3 : x <= data.pairs * 1.5 ? 2 : 1);
          }
        }, 350);
      } else {
        misses.current++;
        if (misses.current % 3 === 0) {
          onMistake();
        }
        setTimeout(() => {
          sfx('flip', 0.6);
          setOpen([]);
          busy.current = false;
        }, 800);
      }
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>{preview ? 'Remember the pictures! 👀' : 'Find the matching pairs!'}</Prompt>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', width: data.cols * (size + 10), justifyContent: 'center', marginTop: 10}}>
        {data.cards.map((f, i) => (
          <Card key={i} face={f} size={size} color={CANDY[i % 5]} open={preview || open.includes(i) || matched.has(i)} matched={matched.has(i)} onPress={() => tap(i)} />
        ))}
      </View>
    </View>
  );
}
