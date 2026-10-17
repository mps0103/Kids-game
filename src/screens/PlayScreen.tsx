import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Modal, StyleSheet, Text, ToastAndroid, Vibration, View} from 'react-native';
import {INTERSTITIAL_COOLDOWN_MS, INTERSTITIAL_EVERY_WINS, showInterstitial, showRewarded} from '../ads/ads';
import ParentGate from '../components/ParentGate';
import {BackButton, Backdrop, BigButton, Bouncy, Confetti, Mascot, PopIn} from '../components/ui';
import {useProgress} from '../core/progress';
import {hashString} from '../core/rng';
import {sfx} from '../core/sound';
import {C, DIFF_COLOR, DIFF_LABEL, shadow} from '../core/theme';
import {DIFFICULTIES, Difficulty, Stars} from '../core/types';
import {gameById} from '../games';

const OOPS = ['Oops! Try again 💪', 'Almost! 🙈', 'Look again! 👀', 'You can do it! 🌟'];
const PRAISE: Record<Stars, string[]> = {
  3: ['AMAZING! 🤩', 'Super brain! 🧠', 'Perfect! 🏆'],
  2: ['Great job! 🎉', 'Well done! 👏'],
  1: ['You did it! 🙌', 'Nice try! Keep going 💪'],
};

export default function PlayScreen({
  gameId,
  difficulty,
  level,
  onLevel,
  onExit,
}: {
  gameId: string;
  difficulty: Difficulty;
  level: number;
  onLevel: (lv: number) => void;
  onExit: () => void;
}) {
  const g = gameById(gameId);
  const {recordWin, state, markInterstitialShown} = useProgress();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Stars | null>(null);
  const [say, setSay] = useState<string | undefined>(undefined);
  const [mood, setMood] = useState<'happy' | 'oops' | 'party'>('happy');
  const [gate, setGate] = useState(false);
  const sayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seed = (hashString(gameId) ^ (DIFFICULTIES.indexOf(difficulty) * 7919 + level * 104729)) >>> 0;

  useEffect(() => {
    setResult(null);
    setMood('happy');
    setSay(`Level ${level}! Let's go 🚀`);
    sayTimer.current = setTimeout(() => setSay(undefined), 1800);
    return () => {
      if (sayTimer.current) {
        clearTimeout(sayTimer.current);
      }
    };
  }, [level, attempt]);

  const onMistake = useCallback(() => {
    sfx('wrong', 0.8);
    if (state.vibration) {
      Vibration.vibrate(40);
    }
    setMood('oops');
    setSay(OOPS[Math.floor(Math.random() * OOPS.length)]);
    if (sayTimer.current) {
      clearTimeout(sayTimer.current);
    }
    sayTimer.current = setTimeout(() => {
      setSay(undefined);
      setMood('happy');
    }, 1300);
  }, [state.vibration]);

  const onWin = useCallback(
    (s: Stars) => {
      recordWin(gameId, difficulty, level, s);
      sfx('win');
      for (let i = 1; i <= s; i++) {
        setTimeout(() => sfx('star', 0.8), 250 + i * 220);
      }
      if (state.vibration) {
        Vibration.vibrate([0, 30, 60, 30]);
      }
      setMood('party');
      setSay(undefined);
      setResult(s);
    },
    [recordWin, gameId, difficulty, level, state.vibration],
  );

  /** Natural break after a finished level: maybe show an interstitial first. */
  const afterBreak = (go: () => void) => {
    const due = state.winsSinceAd >= INTERSTITIAL_EVERY_WINS && Date.now() - state.lastInterstitialAt > INTERSTITIAL_COOLDOWN_MS;
    if (due) {
      const shown = showInterstitial(go);
      if (shown) {
        markInterstitialShown();
      }
    } else {
      go();
    }
  };

  const next = () => afterBreak(() => (level < 30 ? onLevel(level + 1) : onExit()));
  const replay = () => {
    setResult(null);
    setAttempt(a => a + 1);
  };

  const skipWithAd = () => {
    setGate(false);
    showRewarded(earned => {
      if (earned) {
        recordWin(gameId, difficulty, level, 1);
        if (level < 30) {
          onLevel(level + 1);
        } else {
          onExit();
        }
      } else {
        ToastAndroid.show('Video not ready yet. Try again in a moment.', ToastAndroid.SHORT);
      }
    });
  };

  const Game = g.Component;

  return (
    <View style={{flex: 1}}>
      <Backdrop colors={[C.bg, g.color + '26']} />
      <View style={styles.top}>
        <BackButton onPress={onExit} color={g.color} />
        <View style={{flex: 1, marginLeft: 10}}>
          <Text style={styles.title} numberOfLines={1}>
            {g.emoji} {g.title}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <View style={[styles.pill, {backgroundColor: DIFF_COLOR[difficulty]}]}>
              <Text style={styles.pillText}>{DIFF_LABEL[difficulty]}</Text>
            </View>
            <Text style={styles.level}>Level {level} / 30</Text>
          </View>
        </View>
        <Bouncy onPress={replay} style={[styles.round, shadow]}>
          <Text style={{fontSize: 20}}>🔄</Text>
        </Bouncy>
        <Bouncy onPress={() => setGate(true)} style={[styles.round, shadow, {marginLeft: 8, backgroundColor: C.yellow}]}>
          <Text style={{fontSize: 18}}>⏭️</Text>
        </Bouncy>
      </View>
      <View style={styles.mascotRow}>
        <Mascot size={46} say={say} mood={mood} />
      </View>
      <View style={{flex: 1}}>
        <Game key={`${gameId}-${difficulty}-${level}-${attempt}`} level={level} difficulty={difficulty} seed={seed} onWin={onWin} onMistake={onMistake} />
      </View>

      <Modal visible={result !== null} transparent animationType="fade" onRequestClose={() => setResult(null)}>
        <View style={styles.modalBack}>
          <Confetti count={result === 3 ? 40 : 24} />
          <PopIn style={[styles.card, shadow]}>
            <Mascot size={86} mood="party" />
            <Text style={styles.praise}>{result ? PRAISE[result][level % PRAISE[result].length] : ''}</Text>
            <View style={{flexDirection: 'row', marginVertical: 10}}>
              {[1, 2, 3].map(i => (
                <PopIn key={i} delay={250 + i * 220}>
                  <Text style={{fontSize: i === 2 ? 64 : 50, opacity: result && i <= result ? 1 : 0.2, marginTop: i === 2 ? -10 : 0}}>⭐</Text>
                </PopIn>
              ))}
            </View>
            <Text style={styles.sub}>
              {DIFF_LABEL[difficulty]} · Level {level}
            </Text>
            <View style={styles.btnRow}>
              <BigButton small label="🔁" color={C.orange} onPress={replay} />
              <BigButton small label="🏠" color={C.blue} onPress={() => afterBreak(onExit)} />
              <BigButton small label={level < 30 ? 'Next ▶' : 'Done 🏆'} color={C.green} onPress={next} />
            </View>
          </PopIn>
        </View>
      </Modal>

      <ParentGate visible={gate} reason="Skip this level by watching a short video." onCancel={() => setGate(false)} onPass={skipWithAd} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12},
  round: {width: 46, height: 46, borderRadius: 23, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 20, fontWeight: '900', color: C.ink},
  pill: {borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2},
  pillText: {fontSize: 12, fontWeight: '900', color: C.white},
  level: {fontSize: 14, fontWeight: '800', color: C.inkSoft},
  mascotRow: {paddingHorizontal: 16, paddingTop: 8, minHeight: 62, justifyContent: 'center'},
  modalBack: {flex: 1, backgroundColor: 'rgba(30,20,60,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  card: {backgroundColor: C.white, borderRadius: 34, padding: 22, alignItems: 'center', width: '100%', maxWidth: 380},
  praise: {fontSize: 30, fontWeight: '900', color: C.purple, marginTop: 10, textAlign: 'center'},
  sub: {fontSize: 15, fontWeight: '800', color: C.inkSoft},
  btnRow: {flexDirection: 'row', gap: 10, marginTop: 18},
});
