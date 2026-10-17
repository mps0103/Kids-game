import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Modal, ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import AdBanner from '../ads/AdBanner';
import ParentGate from '../components/ParentGate';
import {Backdrop, BigButton, Bouncy, Chip, Confetti, Mascot, PopIn} from '../components/ui';
import {useProgress} from '../core/progress';
import {sfx} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GAMES} from '../games';

const GREETINGS = ["Hi friend! Let's play! 🎮", 'Ready to grow your brain? 🧠', 'You are a superstar! ⭐', 'Pick a game! 👇'];

function GiftBox({onPress}: {onPress: () => void}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true}),
        Animated.timing(v, {toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true}),
        Animated.delay(700),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v]);
  const rot = v.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-12deg']});
  const ty = v.interpolate({inputRange: [0, 1], outputRange: [0, -8]});
  return (
    <Bouncy onPress={onPress} style={[styles.gift, shadow]}>
      <Animated.Text style={{fontSize: 34, transform: [{translateY: ty}, {rotate: rot}]}}>🎁</Animated.Text>
      <Text style={styles.giftText}>Daily gift!</Text>
    </Bouncy>
  );
}

export default function HomeScreen({onOpenGame, onStickers, onSettings}: {onOpenGame: (id: string) => void; onStickers: () => void; onSettings: () => void}) {
  const {totalStars, state, giftAvailable, claimGift, gameStars, setMusic} = useProgress();
  const {width} = useWindowDimensions();
  const [gate, setGate] = useState(false);
  const [gift, setGift] = useState(0);
  const [greet] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const cardW = (width - 16 * 2 - 14) / 2;

  return (
    <View style={{flex: 1}}>
      <Backdrop />
      <View style={styles.top}>
        <Chip text={`⭐ ${totalStars}`} />
        <Chip text={`🔥 ${state.streak} day${state.streak === 1 ? '' : 's'}`} />
        <View style={{flex: 1}} />
        <Bouncy onPress={() => setMusic(!state.music)} style={[styles.iconBtn, {backgroundColor: state.music ? C.mint : C.grey}, shadow]}>
          <Text style={styles.iconText}>{state.music ? '🎵' : '🔇'}</Text>
        </Bouncy>
        <Bouncy onPress={onStickers} style={[styles.iconBtn, {backgroundColor: C.pink}, shadow]}>
          <Text style={styles.iconText}>📒</Text>
        </Bouncy>
        <Bouncy onPress={() => setGate(true)} style={[styles.iconBtn, {backgroundColor: C.white}, shadow]}>
          <Text style={styles.iconText}>⚙️</Text>
        </Bouncy>
      </View>
      <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 24}}>
        <View style={styles.hero}>
          <Mascot size={78} say={greet} />
          {giftAvailable ? (
            <GiftBox
              onPress={() => {
                sfx('magic');
                setGift(claimGift());
              }}
            />
          ) : null}
        </View>
        <View style={styles.grid}>
          {GAMES.map((g, i) => (
            <PopIn key={g.id} delay={i * 50}>
              <Bouncy onPress={() => onOpenGame(g.id)} style={[styles.card, {width: cardW, backgroundColor: g.color}, shadow]}>
                <View style={styles.cardBubble}>
                  <Text style={{fontSize: 42}}>{g.emoji}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {g.title}
                </Text>
                <Text style={styles.cardSkill}>{g.skill}</Text>
                <View style={styles.cardStars}>
                  <Text style={styles.cardStarsText}>⭐ {gameStars(g.id)} / 270</Text>
                </View>
              </Bouncy>
            </PopIn>
          ))}
        </View>
      </ScrollView>
      <AdBanner />
      <ParentGate visible={gate} reason="Settings are for grown-ups." onCancel={() => setGate(false)} onPass={() => {
        setGate(false);
        onSettings();
      }} />
      <Modal visible={gift > 0} transparent animationType="fade" onRequestClose={() => setGift(0)}>
        <View style={styles.modalBack}>
          <Confetti />
          <PopIn style={[styles.modalCard, shadow]}>
            <Text style={{fontSize: 80}}>🎁</Text>
            <Text style={styles.modalTitle}>+{gift} stars!</Text>
            <Text style={styles.modalBody}>🔥 {state.streak} day streak — come back tomorrow for a bigger gift!</Text>
            <BigButton label="Yay! 🎉" color={C.green} onPress={() => setGift(0)} style={{marginTop: 16}} />
          </PopIn>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6},
  iconBtn: {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center'},
  iconText: {fontSize: 22},
  hero: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12, flexWrap: 'wrap', gap: 10},
  gift: {backgroundColor: C.white, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center'},
  giftText: {fontSize: 12, fontWeight: '900', color: C.pink},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14},
  card: {borderRadius: 28, padding: 14, alignItems: 'center', borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,0.15)'},
  cardBubble: {width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center'},
  cardTitle: {marginTop: 8, fontSize: 18, fontWeight: '900', color: C.white},
  cardSkill: {fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.9)'},
  cardStars: {marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3},
  cardStarsText: {fontSize: 12, fontWeight: '900', color: C.white},
  modalBack: {flex: 1, backgroundColor: 'rgba(30,20,60,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  modalCard: {backgroundColor: C.white, borderRadius: 32, padding: 24, alignItems: 'center', width: '100%', maxWidth: 360},
  modalTitle: {fontSize: 34, fontWeight: '900', color: C.purple},
  modalBody: {fontSize: 16, fontWeight: '800', color: C.inkSoft, textAlign: 'center', marginTop: 6},
});
