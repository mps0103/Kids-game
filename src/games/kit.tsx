import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {C, shadow} from '../core/theme';

export function Prompt({children}: {children: React.ReactNode}) {
  return (
    <View style={[styles.prompt, shadow]}>
      <Text style={styles.promptText}>{children}</Text>
    </View>
  );
}

export function RoundDots({total, done}: {total: number; done: number}) {
  return (
    <View style={styles.dots}>
      {Array.from({length: total}, (_, i) => (
        <View key={i} style={[styles.dot, i < done ? {backgroundColor: C.green} : i === done ? {backgroundColor: C.yellow} : null]} />
      ))}
    </View>
  );
}

export const gameStyles = StyleSheet.create({
  fill: {flex: 1, alignItems: 'center'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});

const styles = StyleSheet.create({
  prompt: {backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginVertical: 8, alignSelf: 'center'},
  promptText: {fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center'},
  dots: {flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 6},
  dot: {width: 14, height: 14, borderRadius: 7, backgroundColor: C.grey},
});
