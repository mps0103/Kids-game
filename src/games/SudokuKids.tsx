import React, {useMemo, useRef, useState} from 'react';
import {Animated, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {Bouncy, useShake} from '../components/ui';
import {createRng, starsFromMistakes} from '../core/rng';
import {note, sfx} from '../core/sound';
import {C, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {SUDOKU_SYMBOLS} from './content';
import {genSudoku, sudokuConflict} from './gen';
import {Prompt} from './kit';

export default function SudokuKids({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const data = useMemo(() => genSudoku(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width, height} = useWindowDimensions();
  const {n, h, w} = data;
  const board = Math.min(width - 32, height * 0.5);
  const cell = board / n;
  const [grid, setGrid] = useState<number[]>(data.givens.slice());
  const [sel, setSel] = useState<number>(() => data.givens.indexOf(-1));
  const [bad, setBad] = useState(-1);
  const mistakes = useRef(0);
  const [shake, doShake] = useShake();
  const done = useRef(false);

  const place = (v: number) => {
    if (done.current || sel < 0 || data.givens[sel] !== -1) {
      return;
    }
    if (sudokuConflict(grid, n, h, w, sel, v)) {
      mistakes.current++;
      setBad(sel);
      doShake();
      onMistake();
      return;
    }
    note(v);
    const g = grid.slice();
    g[sel] = v;
    setGrid(g);
    setBad(-1);
    const nextEmpty = g.findIndex((x, i) => x === -1 && i > sel);
    const anyEmpty = g.indexOf(-1);
    setSel(nextEmpty >= 0 ? nextEmpty : anyEmpty);
    if (anyEmpty === -1) {
      done.current = true;
      setTimeout(() => onWin(starsFromMistakes(mistakes.current)), 500);
    }
  };

  const erase = () => {
    if (sel >= 0 && data.givens[sel] === -1) {
      const g = grid.slice();
      g[sel] = -1;
      setGrid(g);
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>Each row, column and box has every fruit once!</Prompt>
      <View style={[{width: board + 8, height: board + 8, padding: 4, backgroundColor: C.purple, borderRadius: 16, marginTop: 6}, shadow]}>
        <View style={{width: board, height: board, backgroundColor: C.white, borderRadius: 10, overflow: 'hidden'}}>
          {grid.map((v, i) => {
            const row = Math.floor(i / n);
            const col = i % n;
            const given = data.givens[i] !== -1;
            const boxShade = (Math.floor(row / h) + Math.floor(col / w)) % 2 === 0;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  sfx('tap', 0.5);
                  setSel(i);
                }} style={{position: 'absolute', left: col * cell, top: row * cell, width: cell, height: cell}}>
                <Animated.View
                  style={[
                    {
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: sel === i ? '#FFE680' : bad === i ? '#FFC2C4' : boxShade ? '#F6F1FF' : C.white,
                      borderRightWidth: col % w === w - 1 && col !== n - 1 ? 3 : 1,
                      borderBottomWidth: row % h === h - 1 && row !== n - 1 ? 3 : 1,
                      borderColor: row % h === h - 1 || col % w === w - 1 ? C.purple : '#E5DEF5',
                    },
                    bad === i ? {transform: [{translateX: shake}]} : null,
                  ]}>
                  <Text style={{fontSize: cell * 0.55, opacity: given ? 1 : 0.95}}>{v >= 0 ? SUDOKU_SYMBOLS[v] : ''}</Text>
                  {given ? <View style={{position: 'absolute', bottom: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: C.grey}} /> : null}
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 16}}>
        {Array.from({length: n}, (_, v) => (
          <Bouncy key={v} sound={null} onPress={() => place(v)} style={[{width: 62, height: 62, margin: 5, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderBottomColor: C.grey}, shadow]}>
            <Text style={{fontSize: 34}}>{SUDOKU_SYMBOLS[v]}</Text>
          </Bouncy>
        ))}
        <Bouncy onPress={erase} style={[{width: 62, height: 62, margin: 5, borderRadius: 20, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center'}, shadow]}>
          <Text style={{fontSize: 28}}>🧽</Text>
        </Bouncy>
      </View>
    </View>
  );
}
