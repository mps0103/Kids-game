import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, ToastAndroid, useWindowDimensions, View} from 'react-native';
import {showRewarded} from '../ads/ads';
import ParentGate from '../components/ParentGate';
import {Backdrop, BigButton, Bouncy, Chip, Confetti, PopIn} from '../components/ui';
import {useProgress} from '../core/progress';
import {sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';
import {stickerCost, STICKERS} from '../games/content';

export default function StickersScreen({onBack}: {onBack: () => void}) {
  const {totalStars, addBonus} = useProgress();
  const {width} = useWindowDimensions();
  const [gate, setGate] = useState(false);
  const [party, setParty] = useState(0);
  const size = (width - 32 - 3 * 12) / 4;
  const unlocked = STICKERS.filter((_, i) => totalStars >= stickerCost(i)).length;
  const nextCost = unlocked < STICKERS.length ? stickerCost(unlocked) : null;
  const prevCost = unlocked > 0 ? stickerCost(unlocked - 1) : 0;
  const pct = nextCost ? Math.min(1, (totalStars - prevCost) / (nextCost - prevCost)) : 1;

  const bonus = () => {
    setGate(false);
    showRewarded(earned => {
      if (earned) {
        addBonus(10);
        sfx('magic');
        setParty(p => p + 1);
      } else {
        ToastAndroid.show('Video not ready yet. Try again in a moment.', ToastAndroid.SHORT);
      }
    });
  };

  return (
    <View style={{flex: 1}}>
      <Backdrop colors={[C.bg, '#FFE0F0']} />
      <View style={styles.top}>
        <Bouncy onPress={onBack} style={[styles.back, shadow]}>
          <Text style={{fontSize: 24}}>◀</Text>
        </Bouncy>
        <Text style={styles.title}>📒 Sticker Book</Text>
        <Chip text={`⭐ ${totalStars}`} />
      </View>
      <View style={[styles.progress, shadow]}>
        <Text style={styles.progText}>
          {unlocked} / {STICKERS.length} stickers {nextCost ? `· next at ⭐ ${nextCost}` : '· all collected! 🏆'}
        </Text>
        <View style={styles.bar}>
          <View style={[styles.fill, {width: `${pct * 100}%`}]} />
        </View>
        <BigButton small label="🎬 Get +10 ⭐" color={C.purple} onPress={() => setGate(true)} style={{marginTop: 10}} />
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {STICKERS.map((s, i) => {
          const open = totalStars >= stickerCost(i);
          return (
            <PopIn key={i} delay={Math.min(i, 20) * 20}>
              <View style={[styles.sticker, {width: size, height: size, backgroundColor: open ? CANDY[i % CANDY.length] + '30' : '#ECE7F7', borderColor: open ? CANDY[i % CANDY.length] : 'transparent'}]}>
                {open ? (
                  <Text style={{fontSize: size * 0.55}}>{s}</Text>
                ) : (
                  <>
                    <Text style={{fontSize: size * 0.3, opacity: 0.4}}>❓</Text>
                    <Text style={styles.cost}>⭐{stickerCost(i)}</Text>
                  </>
                )}
              </View>
            </PopIn>
          );
        })}
      </ScrollView>
      {party > 0 ? <Confetti key={party} /> : null}
      <ParentGate visible={gate} reason="Watch a short video to earn 10 bonus stars." onCancel={() => setGate(false)} onPass={bonus} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14},
  back: {width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center'},
  title: {flex: 1, fontSize: 24, fontWeight: '900', color: C.ink},
  progress: {margin: 16, backgroundColor: C.white, borderRadius: 22, padding: 14, alignItems: 'center'},
  progText: {fontSize: 15, fontWeight: '800', color: C.inkSoft},
  bar: {height: 16, width: '100%', backgroundColor: '#EEE8FA', borderRadius: 8, marginTop: 8, overflow: 'hidden'},
  fill: {height: 16, backgroundColor: C.pink, borderRadius: 8},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingBottom: 30},
  sticker: {borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 3},
  cost: {fontSize: 11, fontWeight: '900', color: C.inkSoft},
});
