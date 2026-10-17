import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Difficulty, Stars} from './types';

const KEY = 'kbg_progress_v1';

type LevelStars = Record<Difficulty, number[]>; // index = level-1, value 0..3

export interface ProgressState {
  stars: Record<string, LevelStars>;
  bonusStars: number;
  streak: number;
  lastPlayDate: string | null;
  lastGiftDate: string | null;
  vibration: boolean;
  music: boolean;
  sfx: boolean;
  winsSinceAd: number;
  lastInterstitialAt: number;
}

const initial: ProgressState = {
  stars: {},
  bonusStars: 0,
  streak: 0,
  lastPlayDate: null,
  lastGiftDate: null,
  vibration: true,
  music: true,
  sfx: true,
  winsSinceAd: 0,
  lastInterstitialAt: 0,
};

export const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayStr(d);
};

function bumpStreak(s: ProgressState): ProgressState {
  const today = todayStr();
  if (s.lastPlayDate === today) {
    return s;
  }
  const streak = s.lastPlayDate === yesterdayStr() ? s.streak + 1 : 1;
  return {...s, streak, lastPlayDate: today};
}

interface Ctx {
  state: ProgressState;
  ready: boolean;
  getStars: (gameId: string, diff: Difficulty) => number[];
  totalStars: number;
  gameStars: (gameId: string) => number;
  recordWin: (gameId: string, diff: Difficulty, level: number, stars: Stars) => void;
  claimGift: () => number;
  giftAvailable: boolean;
  addBonus: (n: number) => void;
  setVibration: (v: boolean) => void;
  setMusic: (v: boolean) => void;
  setSfx: (v: boolean) => void;
  markInterstitialShown: () => void;
  resetAll: () => void;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<ProgressState>(initial);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => {
        if (raw) {
          setState({...initial, ...JSON.parse(raw)});
        }
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (loaded.current) {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }
  }, [state]);

  const getStars = useCallback(
    (gameId: string, diff: Difficulty) => state.stars[gameId]?.[diff] ?? [],
    [state.stars],
  );

  const gameStars = useCallback(
    (gameId: string) => {
      const g = state.stars[gameId];
      if (!g) {
        return 0;
      }
      return [...g.easy, ...g.hard, ...g.expert].reduce((a, b) => a + (b || 0), 0);
    },
    [state.stars],
  );

  const totalStars = useMemo(() => {
    let t = state.bonusStars;
    Object.values(state.stars).forEach(g => {
      [...g.easy, ...g.hard, ...g.expert].forEach(v => (t += v || 0));
    });
    return t;
  }, [state]);

  const recordWin = useCallback((gameId: string, diff: Difficulty, level: number, stars: Stars) => {
    setState(prev => {
      const g: LevelStars = prev.stars[gameId] ?? {easy: [], hard: [], expert: []};
      const arr = g[diff].slice();
      while (arr.length < level) {
        arr.push(0);
      }
      arr[level - 1] = Math.max(arr[level - 1] || 0, stars);
      const next = {
        ...prev,
        stars: {...prev.stars, [gameId]: {...g, [diff]: arr}},
        winsSinceAd: prev.winsSinceAd + 1,
      };
      return bumpStreak(next);
    });
  }, []);

  const giftAvailable = ready && state.lastGiftDate !== todayStr();

  const claimGift = useCallback(() => {
    if (state.lastGiftDate === todayStr()) {
      return 0;
    }
    const reward = 3 + Math.min(bumpStreak(state).streak, 7);
    setState(prev => {
      if (prev.lastGiftDate === todayStr()) {
        return prev;
      }
      const bumped = bumpStreak(prev);
      return {...bumped, lastGiftDate: todayStr(), bonusStars: bumped.bonusStars + reward};
    });
    return reward;
  }, [state]);

  const addBonus = useCallback((n: number) => setState(p => ({...p, bonusStars: p.bonusStars + n})), []);
  const setVibration = useCallback((v: boolean) => setState(p => ({...p, vibration: v})), []);
  const setMusic = useCallback((v: boolean) => setState(p => ({...p, music: v})), []);
  const setSfx = useCallback((v: boolean) => setState(p => ({...p, sfx: v})), []);
  const markInterstitialShown = useCallback(
    () => setState(p => ({...p, winsSinceAd: 0, lastInterstitialAt: Date.now()})),
    [],
  );
  const resetAll = useCallback(() => setState(p => ({...initial, vibration: p.vibration, music: p.music, sfx: p.sfx})), []);

  const value: Ctx = {
    state,
    ready,
    getStars,
    totalStars,
    gameStars,
    recordWin,
    claimGift,
    giftAvailable,
    addBonus,
    setVibration,
    setMusic,
    setSfx,
    markInterstitialShown,
    resetAll,
  };
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const c = useContext(ProgressContext);
  if (!c) {
    throw new Error('useProgress outside provider');
  }
  return c;
}

/** Highest unlocked level: one after the last completed level in order. */
export function unlockedUpTo(stars: number[]): number {
  let n = 1;
  for (let i = 0; i < stars.length; i++) {
    if (stars[i] > 0) {
      n = i + 2;
    } else {
      break;
    }
  }
  return Math.min(n, 30);
}
