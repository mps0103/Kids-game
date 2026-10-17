import React, {useMemo, useRef, useState} from 'react';
import {Animated, HostInstance, PanResponder, View} from 'react-native';
import {createRng, starsFromMistakes} from '../core/rng';
import {sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genShapes, ShapeKind, ShapePiece} from './gen';
import {Prompt} from './kit';

export function ShapeView({kind, size, color}: {kind: ShapeKind; size: number; color: string}) {
  let inner: React.ReactNode;
  switch (kind) {
    case 'circle':
      inner = <View style={{width: size * 0.9, height: size * 0.9, borderRadius: size, backgroundColor: color}} />;
      break;
    case 'square':
      inner = <View style={{width: size * 0.8, height: size * 0.8, borderRadius: 6, backgroundColor: color}} />;
      break;
    case 'diamond':
      inner = <View style={{width: size * 0.62, height: size * 0.62, borderRadius: 4, backgroundColor: color, transform: [{rotate: '45deg'}]}} />;
      break;
    case 'rectangle':
      inner = <View style={{width: size * 0.95, height: size * 0.55, borderRadius: 4, backgroundColor: color}} />;
      break;
    case 'oval':
      inner = <View style={{width: size * 0.95, height: size * 0.62, borderRadius: size, backgroundColor: color}} />;
      break;
    case 'pill':
      inner = <View style={{width: size * 0.95, height: size * 0.42, borderRadius: size, backgroundColor: color}} />;
      break;
    case 'semicircle':
      inner = <View style={{width: size * 0.9, height: size * 0.45, borderTopLeftRadius: size, borderTopRightRadius: size, backgroundColor: color}} />;
      break;
    case 'parallelogram':
      inner = <View style={{width: size * 0.72, height: size * 0.5, backgroundColor: color, transform: [{skewX: '-22deg'}]}} />;
      break;
    case 'triangle':
    case 'downTriangle':
      inner = (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.47,
            borderRightWidth: size * 0.47,
            borderBottomWidth: size * 0.82,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
            transform: kind === 'downTriangle' ? [{rotate: '180deg'}] : [],
          }}
        />
      );
      break;
  }
  return <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>{inner}</View>;
}

const pxSize = (p: ShapePiece) => (p.size === 'L' ? 78 : 50);
type Rect = {x: number; y: number; w: number; h: number};

function DragPiece({piece, onDrop}: {piece: ShapePiece; onDrop: (x: number, y: number) => boolean}) {
  const pos = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          sfx('tap', 0.6);
          Animated.spring(scale, {toValue: 1.15, useNativeDriver: false}).start();
        },
        onPanResponderMove: Animated.event([null, {dx: pos.x, dy: pos.y}], {useNativeDriver: false}),
        onPanResponderRelease: (_e, g) => {
          Animated.spring(scale, {toValue: 1, useNativeDriver: false}).start();
          if (!onDrop(g.moveX, g.moveY)) {
            Animated.spring(pos, {toValue: {x: 0, y: 0}, useNativeDriver: false, friction: 5}).start();
          }
        },
      }),
    [onDrop, pos, scale],
  );
  return (
    <Animated.View {...responder.panHandlers} style={{margin: 8, zIndex: 10, elevation: 10, transform: [{translateX: pos.x}, {translateY: pos.y}, {scale}]}}>
      <ShapeView kind={piece.kind} size={pxSize(piece)} color={CANDY[piece.color % CANDY.length]} />
    </Animated.View>
  );
}

export default function ShapePuzzle({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const data = useMemo(() => genShapes(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const slotRefs = useRef<Record<string, HostInstance | null>>({});
  const rects = useRef<Record<string, Rect>>({});
  const mistakes = useRef(0);

  const measureSlots = () => {
    Object.entries(slotRefs.current).forEach(([id, ref]) =>
      ref?.measure((_x, _y, w, h, px, py) => {
        rects.current[id] = {x: px, y: py, w, h};
      }),
    );
  };

  const dropFor = (piece: ShapePiece) => (x: number, y: number) => {
    measureSlots();
    const hit = Object.entries(rects.current).find(([id, r]) => !placed.has(id) && x >= r.x - 12 && x <= r.x + r.w + 12 && y >= r.y - 12 && y <= r.y + r.h + 12);
    if (!hit) {
      return false;
    }
    if (hit[0] === piece.id) {
      sfx('correct');
      const next = new Set(placed);
      next.add(piece.id);
      setPlaced(next);
      if (next.size === data.slots.length) {
        setTimeout(() => onWin(starsFromMistakes(mistakes.current)), 400);
      }
      return true;
    }
    mistakes.current++;
    onMistake();
    return false;
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>Drag each shape into its shadow 🧩</Prompt>
      <View onLayout={() => setTimeout(measureSlots, 300)} style={[{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: C.white, borderRadius: 24, padding: 12, margin: 12, minHeight: 140, alignItems: 'center'}, shadow]}>
        {data.slots.map(s => (
          <View key={s.id} ref={el => {
            slotRefs.current[s.id] = el;
          }} collapsable={false} style={{margin: 10}}>
            <ShapeView kind={s.kind} size={pxSize(s)} color={placed.has(s.id) ? CANDY[s.color % CANDY.length] : '#D9D2EC'} />
          </View>
        ))}
      </View>
      <View style={{flex: 1}} />
      <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 12, marginBottom: 20, minHeight: 120}}>
        {data.pieces.map(p => (placed.has(p.id) ? <View key={p.id} style={{width: pxSize(p) + 16, height: pxSize(p) + 16}} /> : <DragPiece key={p.id} piece={p} onDrop={dropFor(p)} />))}
      </View>
    </View>
  );
}
