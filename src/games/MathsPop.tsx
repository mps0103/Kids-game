import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {createRng, starsFromMistakes} from '../core/rng';
import {sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genMaths} from './gen';
import {RoundDots} from './kit';

function Balloon({value, color, x, delay, onPop}: {value: number; color: string; x: number; delay: number; onPop: (v: number, shake: () => void, pop: () => void) => void}) {
  const bob = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const popV = useRef(new Animated.Value(0)).current;
  const shakeV = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enter, {toValue: 1, delay, useNativeDriver: true, friction: 6}).start();
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {toValue: 1, duration: 1400 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(bob, {toValue: 0, duration: 1400 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [bob, enter, delay]);
  const ty = Animated.add(bob.interpolate({inputRange: [0, 1], outputRange: [0, -16]}), enter.interpolate({inputRange: [0, 1], outputRange: [300, 0]}));
  const scale = popV.interpolate({inputRange: [0, 1], outputRange: [1, 1.8]});
  const opacity = popV.interpolate({inputRange: [0, 0.6, 1], outputRange: [1, 0.6, 0]});
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeV, {toValue: 12, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeV, {toValue: -12, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeV, {toValue: 6, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeV, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
  };
  const pop = () => Animated.timing(popV, {toValue: 1, duration: 300, useNativeDriver: true}).start();
  return (
    <Animated.View style={{position: 'absolute', left: x, bottom: 20, alignItems: 'center', opacity, transform: [{translateY: ty}, {translateX: shakeV}, {scale}]}}>
      <Pressable onPress={() => onPop(value, shake, pop)}>
        <View style={[{width: 76, height: 92, borderRadius: 40, backgroundColor: color, alignItems: 'center', justifyContent: 'center'}, shadow]}>
          <View style={{position: 'absolute', top: 12, left: 16, width: 14, height: 22, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.45)'}} />
          <Text style={{fontSize: 30, fontWeight: '900', color: C.white}}>{value}</Text>
        </View>
      </Pressable>
      <View style={{width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color, transform: [{rotate: '180deg'}]}} />
      <View style={{width: 2, height: 50, backgroundColor: '#B9AED6'}} />
    </Animated.View>
  );
}

export default function MathsPop({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const qs = useMemo(() => genMaths(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width} = useWindowDimensions();
  const [qi, setQi] = useState(0);
  const mistakes = useRef(0);
  const locked = useRef(false);
  const q = qs[Math.min(qi, qs.length - 1)];
  const n = q.options.length;
  const cols = n <= 4 ? n : Math.ceil(n / 2);
  const slotW = (width - 24) / cols;

  const onPop = (v: number, shake: () => void, pop: () => void) => {
    if (locked.current) {
      return;
    }
    if (v === q.answer) {
      locked.current = true;
      sfx('pop');
      setTimeout(() => sfx('correct', 0.8), 150);
      pop();
      setTimeout(() => {
        locked.current = false;
        if (qi + 1 >= qs.length) {
          onWin(starsFromMistakes(mistakes.current));
        } else {
          setQi(qi + 1);
        }
      }, 450);
    } else {
      mistakes.current++;
      shake();
      onMistake();
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <RoundDots total={qs.length} done={qi} />
      <View style={[{backgroundColor: C.white, borderRadius: 26, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8}, shadow]}>
        <Text style={{fontSize: 44, fontWeight: '900', color: C.purple}}>{q.text} = ?</Text>
      </View>
      <Text style={{fontSize: 16, fontWeight: '800', color: C.inkSoft, marginTop: 10}}>Pop the balloon with the answer 🎈</Text>
      <View key={qi} style={{flex: 1, width: '100%'}}>
        {q.options.map((v, i) => {
          const row = n <= 4 ? 0 : Math.floor(i / cols);
          const col = n <= 4 ? i : i % cols;
          return (
            <View key={`${qi}-${v}`} pointerEvents="box-none" style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: row * 150}}>
              <Balloon value={v} color={CANDY[(i + qi) % CANDY.length]} x={12 + col * slotW + slotW / 2 - 38} delay={i * 90} onPop={onPop} />
            </View>
          );
        })}
      </View>
    </View>
  );
}
