import React, {useMemo, useRef, useState} from 'react';
import {HostInstance, PanResponder, Text, useWindowDimensions, View} from 'react-native';
import {createRng} from '../core/rng';
import {sfx} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genFlow} from './gen';
import {Prompt} from './kit';

const COLORS = ['#FF5A5F', '#3FA9F5', '#2ECC71', '#FFD23F', '#9B5CFF', '#FF9A3C', '#FF5FA2', '#00B8D9', '#8B5E3C'];

export default function ConnectDots({level, difficulty, seed, onWin}: GameProps) {
  const data = useMemo(() => genFlow(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width, height} = useWindowDimensions();
  const N = data.size;
  const boardPx = Math.min(width - 32, height * 0.58);
  const cell = boardPx / N;

  const endColor = useMemo(() => {
    const m = new Map<number, number>();
    data.ends.forEach(([a, b], k) => {
      m.set(a, k);
      m.set(b, k);
    });
    return m;
  }, [data]);

  const paths = useRef<number[][]>(data.ends.map(() => []));
  const active = useRef<number | null>(null);
  const origin = useRef({x: 0, y: 0});
  const boardRef = useRef<HostInstance>(null);
  const done = useRef(false);
  const [, force] = useState(0);
  const redraw = () => force(x => x + 1);

  const isComplete = (k: number) => {
    const p = paths.current[k];
    if (p.length < 2) {
      return false;
    }
    const [a, b] = data.ends[k];
    return (p[0] === a && p[p.length - 1] === b) || (p[0] === b && p[p.length - 1] === a);
  };

  const cellAt = (px: number, py: number) => {
    const c = Math.floor((px - origin.current.x) / cell);
    const r = Math.floor((py - origin.current.y) / cell);
    if (c < 0 || r < 0 || c >= N || r >= N) {
      return -1;
    }
    return r * N + c;
  };

  const ownerOf = (c: number) => paths.current.findIndex(p => p.includes(c));

  const start = (c: number) => {
    if (c < 0) {
      active.current = null;
      return;
    }
    const ek = endColor.get(c);
    if (ek !== undefined) {
      paths.current[ek] = [c];
      active.current = ek;
      sfx('tap', 0.6);
    } else {
      const k = ownerOf(c);
      if (k >= 0) {
        paths.current[k] = paths.current[k].slice(0, paths.current[k].indexOf(c) + 1);
        active.current = k;
      } else {
        active.current = null;
      }
    }
    redraw();
  };

  const adjacent = (a: number, b: number) => {
    const ar = Math.floor(a / N);
    const br = Math.floor(b / N);
    return (ar === br && Math.abs(a - b) === 1) || (a % N === b % N && Math.abs(ar - br) === 1);
  };

  const stepTo = (c: number): boolean => {
    const k = active.current;
    if (k === null) {
      return false;
    }
    const p = paths.current[k];
    const last = p[p.length - 1];
    if (c === last || !adjacent(last, c)) {
      return false;
    }
    if (p.length >= 2 && c === p[p.length - 2]) {
      p.pop();
      return true;
    }
    if (isComplete(k)) {
      return false;
    }
    const inOwn = p.indexOf(c);
    if (inOwn >= 0) {
      paths.current[k] = p.slice(0, inOwn + 1);
      return true;
    }
    const ek = endColor.get(c);
    if (ek !== undefined) {
      if (ek === k && c !== p[0]) {
        p.push(c);
        sfx('correct', 0.8);
        return true;
      }
      return false;
    }
    const other = ownerOf(c);
    if (other >= 0 && other !== k) {
      const op = paths.current[other];
      paths.current[other] = op.slice(0, op.indexOf(c));
    }
    p.push(c);
    return true;
  };

  const moveTo = (target: number) => {
    const k = active.current;
    if (k === null || target < 0) {
      return;
    }
    let guard = 0;
    while (guard++ < 20) {
      const p = paths.current[k];
      const last = p[p.length - 1];
      if (last === target) {
        break;
      }
      const lr = Math.floor(last / N);
      const lc = last % N;
      const tr = Math.floor(target / N);
      const tc = target % N;
      let next: number;
      if (Math.abs(tr - lr) >= Math.abs(tc - lc)) {
        next = last + (tr > lr ? N : -N);
      } else {
        next = last + (tc > lc ? 1 : -1);
      }
      if (!stepTo(next)) {
        break;
      }
    }
    redraw();
  };

  const finishCheck = () => {
    if (done.current) {
      return;
    }
    if (data.ends.every((_, k) => isComplete(k))) {
      done.current = true;
      const filled = paths.current.reduce((a, p) => a + p.length, 0);
      setTimeout(() => onWin(filled === N * N ? 3 : 2), 300);
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: e => {
          // locationX/Y are relative to the board itself, so they are always correct here.
          const {locationX, locationY, pageX, pageY} = e.nativeEvent;
          origin.current = {x: pageX - locationX, y: pageY - locationY};
          start(cellAt(pageX, pageY));
        },
        onPanResponderMove: (_e, g) => moveTo(cellAt(g.moveX, g.moveY)),
        onPanResponderRelease: () => {
          active.current = null;
          finishCheck();
          redraw();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, cell],
  );

  // segments to draw
  const center = (c: number) => ({x: (c % N) * cell + cell / 2, y: Math.floor(c / N) * cell + cell / 2});
  const thick = cell * 0.34;

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>Join the same colours. Fill every box for 3 ⭐</Prompt>
      <View ref={boardRef} {...responder.panHandlers} style={[{width: boardPx, height: boardPx, backgroundColor: C.white, borderRadius: 16, marginTop: 10, overflow: 'hidden'}, shadow]}>
        <View pointerEvents="none" style={{position: 'absolute', left: 0, top: 0, width: boardPx, height: boardPx}}>
        {Array.from({length: N * N}, (_, c) => {
          const k = ownerOf(c);
          return (
            <View
              key={c}
              style={{position: 'absolute', left: (c % N) * cell, top: Math.floor(c / N) * cell, width: cell, height: cell, borderWidth: 0.5, borderColor: '#EEE8FA', backgroundColor: k >= 0 ? COLORS[k % COLORS.length] + '33' : 'transparent'}}
            />
          );
        })}
        {paths.current.map((p, k) =>
          p.slice(1).map((c, i) => {
            const a = center(p[i]);
            const b = center(c);
            const horiz = a.y === b.y;
            return (
              <View
                key={`${k}-${i}`}
                style={{
                  position: 'absolute',
                  backgroundColor: COLORS[k % COLORS.length],
                  borderRadius: thick / 2,
                  left: Math.min(a.x, b.x) - thick / 2,
                  top: Math.min(a.y, b.y) - thick / 2,
                  width: horiz ? Math.abs(a.x - b.x) + thick : thick,
                  height: horiz ? thick : Math.abs(a.y - b.y) + thick,
                }}
              />
            );
          }),
        )}
        {data.ends.map(([a, b], k) =>
          [a, b].map(c => {
            const p = center(c);
            const s = cell * 0.68;
            return (
              <View key={`e${c}`} style={{position: 'absolute', left: p.x - s / 2, top: p.y - s / 2, width: s, height: s, borderRadius: s / 2, backgroundColor: COLORS[k % COLORS.length], alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.white}}>
                {isComplete(k) ? <Text style={{fontSize: s * 0.45, color: C.white, fontWeight: '900'}}>✓</Text> : null}
              </View>
            );
          }),
        )}
        </View>
      </View>
      <Text style={{marginTop: 12, fontSize: 15, fontWeight: '800', color: C.inkSoft}}>
        {data.ends.filter((_, k) => isComplete(k)).length} / {data.ends.length} joined
      </Text>
    </View>
  );
}
