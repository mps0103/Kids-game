import React, {useMemo, useState} from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {C, shadow} from '../core/theme';
import {Bouncy} from './ui';

/** Simple grown-up check (multiplication) before ads, settings or links. */
export default function ParentGate({visible, onPass, onCancel, reason}: {visible: boolean; onPass: () => void; onCancel: () => void; reason?: string}) {
  const [attempt, setAttempt] = useState(0);
  const q = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 4 + Math.floor(Math.random() * 6);
    const ans = a * b;
    const opts = new Set<number>([ans]);
    while (opts.size < 4) {
      opts.add(ans + (Math.floor(Math.random() * 11) - 5) || ans + 7);
    }
    return {a, b, ans, opts: Array.from(opts).sort(() => Math.random() - 0.5)};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, attempt]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.back}>
        <View style={[styles.card, shadow]}>
          <Text style={styles.title}>👨‍👩‍👧 Grown-ups only</Text>
          {reason ? <Text style={styles.reason}>{reason}</Text> : null}
          <Text style={styles.q}>
            {q.a} × {q.b} = ?
          </Text>
          <View style={styles.row}>
            {q.opts.map(o => (
              <Bouncy
                key={o}
                style={styles.opt}
                onPress={() => {
                  if (o === q.ans) {
                    onPass();
                  } else {
                    setAttempt(x => x + 1);
                  }
                }}>
                <Text style={styles.optText}>{o}</Text>
              </Bouncy>
            ))}
          </View>
          <Bouncy onPress={onCancel} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Bouncy>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  back: {flex: 1, backgroundColor: 'rgba(30,20,60,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  card: {backgroundColor: C.white, borderRadius: 28, padding: 22, width: '100%', maxWidth: 380, alignItems: 'center'},
  title: {fontSize: 22, fontWeight: '900', color: C.ink},
  reason: {fontSize: 14, fontWeight: '700', color: C.inkSoft, marginTop: 6, textAlign: 'center'},
  q: {fontSize: 36, fontWeight: '900', color: C.purple, marginVertical: 16},
  row: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10},
  opt: {backgroundColor: C.bg, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, minWidth: 70, alignItems: 'center'},
  optText: {fontSize: 22, fontWeight: '900', color: C.ink},
  cancel: {marginTop: 16, padding: 8},
  cancelText: {fontSize: 16, fontWeight: '800', color: C.inkSoft},
});
