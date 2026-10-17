import React from 'react';
import {Alert, Linking, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {BackButton, Backdrop, Bouncy} from '../components/ui';
import {useProgress} from '../core/progress';
import {C, shadow} from '../core/theme';

// Hosted from docs/ via GitHub Pages
export const PRIVACY_URL = 'https://mps0103.github.io/Kids-game/privacy.html';
export const TERMS_URL = 'https://mps0103.github.io/Kids-game/terms.html';
export const SUPPORT_EMAIL = 'info@dealtrix.com';

function Row({icon, label, right, onPress}: {icon: string; label: string; right?: React.ReactNode; onPress?: () => void}) {
  return (
    <Bouncy onPress={onPress} disabled={!onPress} scaleTo={0.97} style={[styles.row, shadow]}>
      <Text style={{fontSize: 24}}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      {right}
    </Bouncy>
  );
}

export default function SettingsScreen({onBack}: {onBack: () => void}) {
  const {state, setVibration, setMusic, setSfx, resetAll, totalStars} = useProgress();

  const reset = () =>
    Alert.alert('Reset all progress?', 'Stars, levels and stickers will be cleared.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Reset', style: 'destructive', onPress: resetAll},
    ]);


  return (
    <View style={{flex: 1}}>
      <Backdrop />
      <View style={styles.top}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>Grown-ups</Text>
      </View>
      <ScrollView contentContainerStyle={{padding: 16, gap: 12}}>
        <View style={[styles.stat, shadow]}>
          <Text style={styles.statBig}>⭐ {totalStars}</Text>
          <Text style={styles.statSub}>stars earned · 🔥 {state.streak} day streak</Text>
        </View>
        <Row icon="🎵" label="Music" right={<Switch value={state.music} onValueChange={setMusic} />} />
        <Row icon="🔔" label="Sound effects" right={<Switch value={state.sfx} onValueChange={setSfx} />} />
        <Row icon="📳" label="Vibration" right={<Switch value={state.vibration} onValueChange={setVibration} />} />
        <Row icon="🔒" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} right={<Text style={styles.chev}>›</Text>} />
        <Row icon="📄" label="Terms of use" onPress={() => Linking.openURL(TERMS_URL)} right={<Text style={styles.chev}>›</Text>} />
        <Row icon="✉️" label="Contact us" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} right={<Text style={styles.chev}>›</Text>} />
        <Row icon="🗑️" label="Reset progress" onPress={reset} right={<Text style={styles.chev}>›</Text>} />
        <View style={[styles.note, shadow]}>
          <Text style={styles.noteText}>
            Brainy Owl works fully offline. Ads are child-safe (G-rated, non-personalised) and only appear between levels and on menu screens. Settings and the skip-level video are behind a grown-up check. The bonus-stars video in the Sticker Book is optional and can be tapped by children.
          </Text>
        </View>
        <Text style={styles.ver}>Brainy Owl by MPS · v1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14},
  title: {fontSize: 26, fontWeight: '900', color: C.ink},
  stat: {backgroundColor: C.purple, borderRadius: 24, padding: 18, alignItems: 'center'},
  statBig: {fontSize: 36, fontWeight: '900', color: C.white},
  statSub: {fontSize: 15, fontWeight: '800', color: 'rgba(255,255,255,0.9)'},
  row: {flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 20, padding: 16, gap: 12},
  label: {flex: 1, fontSize: 18, fontWeight: '800', color: C.ink},
  chev: {fontSize: 28, color: C.inkSoft, fontWeight: '900'},
  note: {backgroundColor: C.white, borderRadius: 20, padding: 16},
  noteText: {fontSize: 14, fontWeight: '700', color: C.inkSoft, lineHeight: 20},
  ver: {textAlign: 'center', fontSize: 13, fontWeight: '800', color: C.inkSoft, marginTop: 8},
});
