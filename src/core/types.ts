import type React from 'react';

export type Difficulty = 'easy' | 'hard' | 'expert';
export const DIFFICULTIES: Difficulty[] = ['easy', 'hard', 'expert'];
export const LEVELS_PER_DIFFICULTY = 30;

export type Stars = 1 | 2 | 3;

export interface GameProps {
  level: number; // 1..30
  difficulty: Difficulty;
  seed: number;
  onWin: (stars: Stars) => void;
  onMistake: () => void;
}

export interface GameDef {
  id: string;
  title: string;
  emoji: string;
  skill: string;
  howTo: string;
  color: string;
  Component: React.ComponentType<GameProps>;
}
