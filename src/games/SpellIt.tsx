import React, {useMemo, useRef, useState} from 'react';
import {Animated, Text, useWindowDimensions, View} from 'react-native';
import {Bouncy, PopIn, useShake} from '../components/ui';
import {createRng, starsFromMistakes} from '../core/rng';
import {note, sfx} from '../core/sound';
import {C, CANDY, shadow} from '../core/theme';
import {GameProps} from '../core/types';
import {genSpell} from './gen';
import {Prompt, RoundDots} from './kit';

export default function SpellIt({level, difficulty, seed, onWin, onMistake}: GameProps) {
  const rounds = useMemo(() => genSpell(createRng(seed), difficulty, level), [seed, difficulty, level]);
  const {width} = useWindowDimensions();
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [wrongTile, setWrongTile] = useState(-1);
  const mistakes = useRef(0);
  const [shake, doShake] = useShake();
  const busy = useRef(false);
  const r = rounds[Math.min(round, rounds.length - 1)];
  const word = r.word.w;
  const slot = Math.min((width - 40) / word.length - 6, 58);
  const tileCols = Math.min(r.tiles.length, 5);
  const tile = Math.min((width - 40) / tileCols - 12, 66);

  const tap = (i: number) => {
    if (busy.current || used.has(i)) {
      return;
    }
    if (r.tiles[i] === word[pos]) {
      note(pos);
      const u = new Set(used);
      u.add(i);
      setUsed(u);
      setWrongTile(-1);
      const p = pos + 1;
      setPos(p);
      if (p >= word.length) {
        busy.current = true;
        setTimeout(() => sfx('correct'), 250);
        setTimeout(() => {
          busy.current = false;
          setPos(0);
          setUsed(new Set());
          if (round + 1 >= rounds.length) {
            onWin(starsFromMistakes(mistakes.current));
          } else {
            setRound(round + 1);
          }
        }, 900);
      }
    } else {
      mistakes.current++;
      setWrongTile(i);
      doShake();
      onMistake();
    }
  };

  const doneWord = pos >= word.length;

  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Prompt>Spell the picture ✏️</Prompt>
      <RoundDots total={rounds.length} done={round} />
      <PopIn key={round} style={[{width: 150, height: 150, borderRadius: 40, backgroundColor: doneWord ? '#E6FFF1' : C.white, alignItems: 'center', justifyContent: 'center', marginTop: 8}, shadow]}>
        <Text style={{fontSize: 92}}>{r.word.e}</Text>
      </PopIn>
      <View style={{flexDirection: 'row', marginTop: 20}}>
        {word.split('').map((ch, i) => (
          <View key={i} style={{width: slot, height: slot * 1.15, margin: 3, borderRadius: 12, backgroundColor: i < pos ? CANDY[i % CANDY.length] : C.white, borderBottomWidth: 4, borderBottomColor: i === pos ? C.purple : C.grey, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{fontSize: slot * 0.6, fontWeight: '900', color: i < pos ? C.white : '#D5CCEB'}}>{i < pos ? ch : r.ghost ? ch : ''}</Text>
          </View>
        ))}
      </View>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 28, width: tileCols * (tile + 12)}}>
        {r.tiles.map((ch, i) => (
          <Bouncy key={`${round}-${i}`} sound={null} onPress={() => tap(i)} disabled={used.has(i)} style={{margin: 6, opacity: used.has(i) ? 0.15 : 1}}>
            <Animated.View style={[{width: tile, height: tile, borderRadius: 18, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderBottomColor: '#E0A800'}, shadow, wrongTile === i ? {transform: [{translateX: shake}], backgroundColor: '#FFC2C4'} : null]}>
              <Text style={{fontSize: tile * 0.55, fontWeight: '900', color: C.ink}}>{ch}</Text>
            </Animated.View>
          </Bouncy>
        ))}
      </View>
    </View>
  );
}
