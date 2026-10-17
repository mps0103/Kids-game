import React from 'react';
import {ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import AdBanner from '../ads/AdBanner';
import {BackButton, Backdrop, Bouncy, PopIn, StarRow} from '../components/ui';
import {unlockedUpTo, useProgress} from '../core/progress';
import {C, DIFF_COLOR, DIFF_EMOJI, DIFF_LABEL, shadow} from '../core/theme';
import {DIFFICULTIES, Difficulty, LEVELS_PER_DIFFICULTY} from '../core/types';
import {gameById} from '../games';

export default function LevelsScreen({
  gameId,
  difficulty,
  onDifficulty,
  onPlay,
  onBack,
}: {
  gameId: string;
  difficulty: Difficulty;
  onDifficulty: (d: Difficulty) => void;
  onPlay: (level: number) => void;
  onBack: () => void;
}) {
  const g = gameById(gameId);
  const {getStars} = useProgress();
  const {width} = useWindowDimensions();
  const stars = getStars(gameId, difficulty);
  const open = unlockedUpTo(stars);
  const size = (width - 32 - 4 * 12) / 5;

  return (
    <View style={{flex: 1}}>
      <Backdrop colors={[C.bg, g.color + '33']} />
      <View style={styles.top}>
        <BackButton onPress={onBack} color={g.color} />
        <Text style={{fontSize: 34, marginLeft: 10}}>{g.emoji}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {g.title}
        </Text>
      </View>
      <View style={[styles.howTo, shadow]}>
        <Text style={styles.howToText}>💡 {g.howTo}</Text>
      </View>
      <Text style={styles.tabsHeading}>Choose difficulty 👇</Text>
      <View style={[styles.tabs, shadow]}>
        {DIFFICULTIES.map(d => {
          const on = d === difficulty;
          const done = getStars(gameId, d).filter(x => x > 0).length;
          // Bouncy doesn't forward accessibility props, so the wrapper carries them
          return (
            <View
              key={d}
              style={{flex: 1, flexDirection: 'row'}}
              accessible
              accessibilityRole="tab"
              accessibilityState={{selected: on}}
              accessibilityLabel={`${DIFF_LABEL[d]} levels`}
              accessibilityActions={[{name: 'activate'}]}
              onAccessibilityAction={() => onDifficulty(d)}>
              <Bouncy
                containerStyle={[{flex: 1}, on && {transform: [{scale: 1.05}]}]}
                onPress={() => onDifficulty(d)}
                style={[styles.tab, on ? {backgroundColor: DIFF_COLOR[d], borderWidth: 3, borderStyle: 'solid', borderColor: C.white} : {backgroundColor: DIFF_COLOR[d] + '22', borderWidth: 2, borderStyle: 'dashed', borderColor: DIFF_COLOR[d] + '66'}]}>
                <Text style={{fontSize: 22}}>{DIFF_EMOJI[d]}</Text>
                <Text style={[styles.tabText, {color: on ? C.white : DIFF_COLOR[d]}]}>
                  {on ? '✓ ' : ''}
                  {DIFF_LABEL[d]}
                </Text>
                <Text style={[styles.tabSub, {color: on ? C.white : DIFF_COLOR[d]}]}>
                  {done}/{LEVELS_PER_DIFFICULTY} ⭐
                </Text>
              </Bouncy>
            </View>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {Array.from({length: LEVELS_PER_DIFFICULTY}, (_, i) => {
          const lv = i + 1;
          const locked = lv > open;
          const s = stars[i] || 0;
          const current = lv === open && s === 0;
          return (
            <PopIn key={`${difficulty}-${lv}`} delay={i * 18}>
              <Bouncy
                disabled={locked}
                onPress={() => onPlay(lv)}
                style={[
                  styles.level,
                  {width: size, height: size + 14, backgroundColor: locked ? '#E9E4F5' : s > 0 ? DIFF_COLOR[difficulty] : C.white, borderColor: current ? C.yellow : 'transparent'},
                  shadow,
                ]}>
                {locked ? (
                  <Text style={{fontSize: 22}}>🔒</Text>
                ) : (
                  <>
                    <Text style={[styles.levelNum, {color: s > 0 ? C.white : C.ink}]}>{lv}</Text>
                    <StarRow stars={s} size={11} />
                  </>
                )}
              </Bouncy>
            </PopIn>
          );
        })}
      </ScrollView>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  top: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14},
  title: {fontSize: 26, fontWeight: '900', color: C.ink, marginLeft: 8, flex: 1},
  howTo: {marginHorizontal: 16, marginTop: 12, backgroundColor: C.white, borderRadius: 18, padding: 12},
  howToText: {fontSize: 15, fontWeight: '800', color: C.inkSoft},
  tabsHeading: {fontSize: 15, fontWeight: '900', color: C.inkSoft, marginHorizontal: 16, marginTop: 14},
  tabs: {flexDirection: 'row', gap: 6, backgroundColor: C.white, borderRadius: 26, padding: 5, marginHorizontal: 16, marginTop: 8},
  tab: {borderRadius: 22, paddingVertical: 8, alignItems: 'center'},
  tabText: {fontSize: 16, fontWeight: '900'},
  tabSub: {fontSize: 11, fontWeight: '800'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16},
  level: {borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 4},
  levelNum: {fontSize: 24, fontWeight: '900'},
});
