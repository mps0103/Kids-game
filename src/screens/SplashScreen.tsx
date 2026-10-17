import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {Backdrop} from '../components/ui';
import {sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';

const TITLE = 'Kids Brain Games';

export default function SplashScreen({onDone}: {onDone: () => void}) {
  const logo = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const letters = useRef(TITLE.split('').map(() => new Animated.Value(0))).current;
  const sub = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, {toValue: 1, friction: 4, tension: 60, useNativeDriver: true}),
      Animated.stagger(45, letters.map(v => Animated.spring(v, {toValue: 1, friction: 4, tension: 120, useNativeDriver: true}))),
      Animated.timing(sub, {toValue: 1, duration: 350, useNativeDriver: true}),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(wobble, {toValue: -1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    ).start();
    const t = setTimeout(onDone, 2600);
    const s = setTimeout(() => sfx('magic'), 700);
    return () => {
      clearTimeout(t);
      clearTimeout(s);
    };
  }, [logo, letters, sub, wobble, onDone]);

  const rot = wobble.interpolate({inputRange: [-1, 1], outputRange: ['-6deg', '6deg']});

  return (
    <View style={styles.wrap}>
      <Backdrop />
      <Animated.View style={[styles.logo, shadow, {transform: [{scale: logo}, {rotate: rot}]}]}>
        <Text style={{fontSize: 92}}>🦉</Text>
        <Text style={styles.cap}>🎓</Text>
      </Animated.View>
      <View style={styles.titleRow}>
        {TITLE.split(' ').map((word, w) => {
          const start = TITLE.split(' ').slice(0, w).join(' ').length + (w ? 1 : 0);
          return (
            <View key={w} style={styles.word}>
              {word.split('').map((ch, k) => {
                const i = start + k;
                return (
                  <Animated.Text
                    key={i}
                    style={[
                      styles.letter,
                      {color: CANDY[i % CANDY.length], opacity: letters[i], transform: [{scale: letters[i]}, {translateY: letters[i].interpolate({inputRange: [0, 1], outputRange: [-30, 0]})}]},
                    ]}>
                    {ch}
                  </Animated.Text>
                );
              })}
            </View>
          );
        })}
      </View>
      <Animated.Text style={[styles.sub, {opacity: sub}]}>12 brain games · by MPS</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  logo: {width: 170, height: 170, borderRadius: 52, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: C.white},
  cap: {position: 'absolute', top: -18, right: 6, fontSize: 52, transform: [{rotate: '18deg'}]},
  titleRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 34, paddingHorizontal: 20, columnGap: 14},
  word: {flexDirection: 'row'},
  letter: {fontSize: 38, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: {width: 0, height: 3}, textShadowRadius: 0},
  sub: {marginTop: 12, fontSize: 17, fontWeight: '800', color: C.inkSoft},
});
