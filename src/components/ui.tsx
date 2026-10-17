import React, {useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {sfx, Sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';

/** Button that squishes when pressed. */
export function Bouncy({
  onPress,
  style,
  children,
  disabled,
  scaleTo = 0.9,
  sound = 'tap',
  containerStyle,
}: {
  sound?: Sfx | null;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
  scaleTo?: number;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, {toValue: v, useNativeDriver: true, speed: 40, bounciness: 12}).start();
  return (
    <Pressable
      style={containerStyle}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={() => {
        if (sound) {
          sfx(sound, 0.7);
        }
        onPress?.();
      }}>
      <Animated.View style={[style, {transform: [{scale: s}]}]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Top-left back button: a candy-coloured rounded square with a white chevron. */
export function BackButton({onPress, color = C.purple}: {onPress: () => void; color?: string}) {
  return (
    <Bouncy onPress={onPress} sound="swoosh" style={[styles.backBtn, {backgroundColor: color}, shadow]}>
      <Text style={styles.backIcon}>❮</Text>
    </Bouncy>
  );
}

export function BigButton({
  label,
  onPress,
  color = C.purple,
  style,
  textStyle,
  small,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  small?: boolean;
}) {
  return (
    <Bouncy onPress={onPress} style={[styles.big, small && styles.bigSmall, {backgroundColor: color}, style]}>
      <Text style={[styles.bigText, small && {fontSize: 17}, textStyle]}>{label}</Text>
    </Bouncy>
  );
}

/** Soft floating bubbles behind every screen. */
export function Backdrop({colors = [C.bg, C.bg2]}: {colors?: [string, string]}) {
  const {width, height} = useWindowDimensions();
  const bubbles = useMemo(
    () =>
      Array.from({length: 9}, (_, i) => ({
        size: 60 + ((i * 37) % 110),
        x: ((i * 97) % 100) / 100,
        y: ((i * 61) % 100) / 100,
        color: CANDY[i % CANDY.length],
        dur: 3000 + i * 400,
      })),
    [],
  );
  return (
    <View style={[StyleSheet.absoluteFill, {backgroundColor: colors[0]}]} pointerEvents="none">
      <View style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.45, backgroundColor: colors[1], borderTopLeftRadius: width, borderTopRightRadius: width, transform: [{scaleX: 1.6}]}} />
      {bubbles.map((b, i) => (
        <FloatBubble key={i} {...b} left={b.x * width - b.size / 2} top={b.y * height - b.size / 2} />
      ))}
    </View>
  );
}

function FloatBubble({size, left, top, color, dur}: {size: number; left: number; top: number; color: string; dur: number}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(v, {toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v, dur]);
  const ty = v.interpolate({inputRange: [0, 1], outputRange: [0, -18]});
  return (
    <Animated.View
      style={{position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.12, transform: [{translateY: ty}]}}
    />
  );
}

/** Owl mascot that bounces and can say things. */
export function Mascot({size = 90, say, mood = 'happy'}: {size?: number; say?: string; mood?: 'happy' | 'oops' | 'party'}) {
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(b, {toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true}),
        Animated.timing(b, {toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true}),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [b]);
  const ty = b.interpolate({inputRange: [0, 1], outputRange: [0, -10]});
  const rot = b.interpolate({inputRange: [0, 1], outputRange: mood === 'party' ? ['-8deg', '8deg'] : ['0deg', '0deg']});
  const face = mood === 'oops' ? '🙈' : mood === 'party' ? '🥳' : '🦉';
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Animated.View
        style={[
          {width: size, height: size, borderRadius: size / 2, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center'},
          shadow,
          {transform: [{translateY: ty}, {rotate: rot}]},
        ]}>
        <Text style={{fontSize: size * 0.62}}>{face}</Text>
      </Animated.View>
      {say ? (
        <View style={[styles.bubble, shadow]}>
          <Text style={styles.bubbleText}>{say}</Text>
        </View>
      ) : null}
    </View>
  );
}

const CONFETTI = ['🎉', '⭐', '🎈', '✨', '🍭', '💖', '🌈', '🎊'];

/** Falling emoji confetti. */
export function Confetti({count = 26}: {count?: number}) {
  const {width, height} = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({length: count}, (_, i) => ({
        x: Math.random() * width,
        delay: Math.random() * 700,
        dur: 1800 + Math.random() * 1400,
        e: CONFETTI[i % CONFETTI.length],
        size: 18 + Math.random() * 18,
        spin: Math.random() > 0.5 ? 1 : -1,
      })),
    [count, width],
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} height={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({x, delay, dur, e, size, spin, height}: {x: number; delay: number; dur: number; e: string; size: number; spin: number; height: number}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {toValue: 1, duration: dur, delay, easing: Easing.in(Easing.quad), useNativeDriver: true}).start();
  }, [v, dur, delay]);
  const ty = v.interpolate({inputRange: [0, 1], outputRange: [-60, height + 60]});
  const rot = v.interpolate({inputRange: [0, 1], outputRange: ['0deg', `${spin * 540}deg`]});
  return <Animated.Text style={{position: 'absolute', left: x, top: 0, fontSize: size, transform: [{translateY: ty}, {rotate: rot}]}}>{e}</Animated.Text>;
}

export function StarRow({stars, size = 16, max = 3}: {stars: number; size?: number; max?: number}) {
  return (
    <View style={{flexDirection: 'row'}}>
      {Array.from({length: max}, (_, i) => (
        <Text key={i} style={{fontSize: size, opacity: i < stars ? 1 : 0.25}}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

/** Pop-in animation wrapper. */
export function PopIn({children, delay = 0, style}: {children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle>}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, {toValue: 1, delay, useNativeDriver: true, friction: 5, tension: 80}).start();
  }, [v, delay]);
  return <Animated.View style={[style, {opacity: v, transform: [{scale: v}]}]}>{children}</Animated.View>;
}

/** Hook: returns an animated value + a trigger that wiggles it. */
export function useShake(): [Animated.Value, () => void] {
  const v = useRef(new Animated.Value(0)).current;
  const go = () => {
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(v, {toValue: -10, duration: 50, useNativeDriver: true}),
      Animated.timing(v, {toValue: 8, duration: 50, useNativeDriver: true}),
      Animated.timing(v, {toValue: -8, duration: 50, useNativeDriver: true}),
      Animated.timing(v, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
  };
  return [v, go];
}

export function Chip({text, color = C.white, textColor = C.ink}: {text: string; color?: string; textColor?: string}) {
  return (
    <View style={[styles.chip, {backgroundColor: color}, shadow]}>
      <Text style={[styles.chipText, {color: textColor}]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {width: 52, height: 52, borderRadius: 18, borderWidth: 3, borderColor: C.white, alignItems: 'center', justifyContent: 'center'},
  backIcon: {fontSize: 24, fontWeight: '900', color: C.white, marginRight: 3},
  big: {paddingVertical: 16, paddingHorizontal: 26, borderRadius: 26, alignItems: 'center', borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,0.18)', ...shadow},
  bigSmall: {paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderBottomWidth: 4},
  bigText: {color: C.white, fontSize: 22, fontWeight: '900'},
  bubble: {marginLeft: 12, backgroundColor: C.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 220},
  bubbleText: {fontSize: 16, fontWeight: '800', color: C.ink},
  chip: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center'},
  chipText: {fontSize: 15, fontWeight: '900'},
});
