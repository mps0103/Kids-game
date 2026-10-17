import React, {useMemo, useRef, useState} from 'react';
import {Animated, PanResponder, Text, useWindowDimensions, View} from 'react-native';
import {Bouncy} from '../components/ui';
import {createRng} from '../core/rng';
import {sfx} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genMaze, WALL} from './gen';
import {Prompt} from './kit';

type Dir = 'N' | 'S' | 'E' | 'W';

function Arrow({d, label, onGo}: {d: Dir; label: string; onGo: (d: Dir) => void}) {
  return (
    <Bouncy sound={null} onPress={() => onGo(d)} style={[{width: 68, height: 68, borderRadius: 22, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center', margin: 4, borderBottomWidth: 5, borderBottomColor: '#5A3FD6'}, shadow]}>
      <Text style={{fontSize: 30, color: C.white, fontWeight: '900'}}>{label}</Text>
    </Bouncy>
  );
}

export default function MazeRunner({level, difficulty, seed, onWin}: GameProps) {
  const data = useMemo(() => genMaze(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width, height} = useWindowDimensions();
  const n = data.n;
  const board = Math.min(width - 32, height * 0.5);
  const cell = board / n;
  const goal = n * n - 1;
  const [at, setAt] = useState(0);
  const [trail, setTrail] = useState<Set<number>>(new Set([0]));
  const moves = useRef(0);
  const posRef = useRef(0);
  const anim = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const done = useRef(false);
  const moving = useRef(false);

  const openings = (c: number) => [WALL.N, WALL.E, WALL.S, WALL.W].filter(w => !(data.walls[c] & w)).length;

  const step = (c: number, d: Dir) => {
    if (data.walls[c] & WALL[d]) {
      return -1;
    }
    return d === 'N' ? c - n : d === 'S' ? c + n : d === 'E' ? c + 1 : c - 1;
  };

  const go = (d: Dir) => {
    if (done.current || moving.current) {
      return;
    }
    let c = posRef.current;
    const path: number[] = [];
    // slide along corridors until a junction, dead end or the goal
    for (let guard = 0; guard < n * n; guard++) {
      const nx = step(c, d);
      if (nx < 0) {
        break;
      }
      c = nx;
      path.push(c);
      if (c === goal || openings(c) !== 2) {
        break;
      }
      // keep the same direction only if the corridor continues straight
      if (step(c, d) < 0) {
        break;
      }
    }
    if (!path.length) {
      sfx('tap', 0.5);
      return;
    }
    sfx('swoosh', 0.7);
    moving.current = true;
    moves.current += path.length;
    posRef.current = c;
    const t = new Set(trail);
    path.forEach(p => t.add(p));
    setTrail(t);
    setAt(c);
    Animated.timing(anim, {toValue: {x: (c % n) * cell, y: Math.floor(c / n) * cell}, duration: 70 * path.length, useNativeDriver: true}).start(() => {
      moving.current = false;
      if (c === goal && !done.current) {
        done.current = true;
        const m = moves.current;
        const s = data.shortest;
        setTimeout(() => onWin(m <= s * 1.25 ? 3 : m <= s * 2 ? 2 : 1), 250);
      }
    });
  };

  const goRef = useRef(go);
  goRef.current = go;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (_e, g) => {
          if (Math.max(Math.abs(g.dx), Math.abs(g.dy)) < 18) {
            return;
          }
          if (Math.abs(g.dx) > Math.abs(g.dy)) {
            goRef.current(g.dx > 0 ? 'E' : 'W');
          } else {
            goRef.current(g.dy > 0 ? 'S' : 'N');
          }
        },
      }),
    [],
  );

  const wallW = Math.max(2, cell * 0.08);

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>Swipe or tap arrows to reach the ⭐</Prompt>
      <View {...responder.panHandlers} style={[{width: board + wallW, height: board + wallW, backgroundColor: C.white, borderRadius: 12, padding: wallW / 2, marginTop: 6}, shadow]}>
        <View style={{width: board, height: board}}>
          {data.walls.map((w, c) => (
            <View
              key={c}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (c % n) * cell,
                top: Math.floor(c / n) * cell,
                width: cell,
                height: cell,
                backgroundColor: trail.has(c) ? '#FFF1C2' : 'transparent',
                borderTopWidth: w & WALL.N ? wallW : 0,
                borderLeftWidth: w & WALL.W ? wallW : 0,
                borderRightWidth: c % n === n - 1 && w & WALL.E ? wallW : 0,
                borderBottomWidth: Math.floor(c / n) === n - 1 && w & WALL.S ? wallW : 0,
                borderColor: C.purple,
              }}
            />
          ))}
          <View pointerEvents="none" style={{position: 'absolute', left: (goal % n) * cell, top: Math.floor(goal / n) * cell, width: cell, height: cell, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{fontSize: cell * 0.62}}>{at === goal ? '🎉' : '⭐'}</Text>
          </View>
          <Animated.View pointerEvents="none" style={{position: 'absolute', width: cell, height: cell, alignItems: 'center', justifyContent: 'center', transform: [{translateX: anim.x}, {translateY: anim.y}]}}>
            <Text style={{fontSize: cell * 0.66}}>🐥</Text>
          </Animated.View>
        </View>
      </View>
      <View style={{alignItems: 'center', marginTop: 10}}>
        <Arrow onGo={go} d="N" label="▲" />
        <View style={{flexDirection: 'row'}}>
          <Arrow onGo={go} d="W" label="◀" />
          <View style={{width: 68, margin: 4}} />
          <Arrow onGo={go} d="E" label="▶" />
        </View>
        <Arrow onGo={go} d="S" label="▼" />
      </View>
    </View>
  );
}
