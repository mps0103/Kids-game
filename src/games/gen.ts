// Pure level generators (no React). Every level is built from a seed so it is
// the same every time, and difficulty grows with level (1..30) and mode.
import {lerp, Rng} from '../core/rng';
import {Difficulty} from '../core/types';
import {
  ASYMMETRIC,
  CARD_EMOJI,
  CATEGORIES,
  COUNT_EMOJI,
  PATTERN_THEMES,
  SCENE_EMOJI,
  SIMILAR_PAIRS,
  TRICKY_PAIRS,
  Word,
  WORDS_EASY,
  WORDS_HARD,
  WORDS_MID,
} from './content';

// ---------- 1. Memory Match ----------
export function genMemory(r: Rng, d: Difficulty, level: number) {
  const pairs = d === 'easy' ? lerp(level, 3, 6) : d === 'hard' ? lerp(level, 6, 8) : lerp(level, 8, 10);
  const faces = r.sample(CARD_EMOJI, pairs);
  const cards = r.shuffle([...faces, ...faces]);
  const cols = pairs <= 3 ? 3 : pairs <= 8 ? 4 : 5;
  const previewMs = d === 'easy' ? 1800 : d === 'hard' ? 900 : 0;
  return {pairs, cards, cols, previewMs};
}

// ---------- 2. Simon Colours ----------
export function genSimon(r: Rng, d: Difficulty, level: number) {
  const pads = d === 'expert' ? 6 : 4;
  const length = d === 'easy' ? lerp(level, 2, 6) : d === 'hard' ? lerp(level, 4, 8) : lerp(level, 5, 10);
  const speed = d === 'easy' ? 650 : d === 'hard' ? 520 : lerp(level, 450, 330);
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let p = r.int(0, pads - 1);
    if (i >= 2 && p === seq[i - 1] && p === seq[i - 2]) {
      p = (p + 1) % pads;
    }
    seq.push(p);
  }
  return {pads, seq, speed};
}

// ---------- 3. Connect the Dots (Flow) ----------
export function genFlow(r: Rng, d: Difficulty, level: number) {
  const size = d === 'easy' ? (level <= 15 ? 4 : 5) : d === 'hard' ? (level <= 15 ? 5 : 6) : level <= 15 ? 6 : 7;
  const colors = d === 'easy' ? size - 1 : d === 'hard' ? size : size + (level > 20 ? 1 : 0);
  // Snake path that covers the whole grid, then scrambled with "backbite" moves.
  let path: number[] = [];
  for (let row = 0; row < size; row++) {
    for (let k = 0; k < size; k++) {
      const col = row % 2 === 0 ? k : size - 1 - k;
      path.push(row * size + col);
    }
  }
  const N = size * size;
  const pos = new Array<number>(N);
  const reindex = () => path.forEach((c, i) => (pos[c] = i));
  reindex();
  const nbrs = (c: number) => {
    const row = Math.floor(c / size);
    const col = c % size;
    const out: number[] = [];
    if (row > 0) {
      out.push(c - size);
    }
    if (row < size - 1) {
      out.push(c + size);
    }
    if (col > 0) {
      out.push(c - 1);
    }
    if (col < size - 1) {
      out.push(c + 1);
    }
    return out;
  };
  const iters = N * 30;
  for (let it = 0; it < iters; it++) {
    if (r.chance(0.5)) {
      path.reverse();
      reindex();
    }
    const tail = path[N - 1];
    const options = nbrs(tail).filter(n => n !== path[N - 2]);
    const n = r.pick(options);
    const idx = pos[n];
    path = [...path.slice(0, idx + 1), ...path.slice(idx + 1).reverse()];
    reindex();
  }
  // Cut into segments of length >= 3.
  const lengths = new Array<number>(colors).fill(3);
  let rest = N - 3 * colors;
  while (rest > 0) {
    lengths[r.int(0, colors - 1)]++;
    rest--;
  }
  const solution: number[][] = [];
  let at = 0;
  for (const len of lengths) {
    solution.push(path.slice(at, at + len));
    at += len;
  }
  const ends = solution.map(s => [s[0], s[s.length - 1]] as [number, number]);
  return {size, ends, solution};
}

// ---------- 4. Shape Puzzle ----------
export const SHAPE_KINDS = ['circle', 'square', 'triangle', 'diamond', 'rectangle', 'oval', 'semicircle', 'pill', 'downTriangle', 'parallelogram'] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];
const LOOKALIKE: ShapeKind[][] = [
  ['square', 'diamond'],
  ['circle', 'oval'],
  ['rectangle', 'pill', 'parallelogram'],
  ['triangle', 'downTriangle'],
];
export type ShapePiece = {id: string; kind: ShapeKind; size: 'S' | 'L'; color: number};

export function genShapes(r: Rng, d: Difficulty, level: number) {
  const n = d === 'easy' ? lerp(level, 2, 4) : d === 'hard' ? lerp(level, 4, 5) : lerp(level, 5, 6);
  const pieces: ShapePiece[] = [];
  const used = new Set<string>();
  const add = (kind: ShapeKind, size: 'S' | 'L') => {
    const id = kind + size;
    if (used.has(id) || pieces.length >= n) {
      return;
    }
    used.add(id);
    pieces.push({id, kind, size, color: pieces.length});
  };
  if (d !== 'easy') {
    LOOKALIKE.forEach(group => {
      if (r.chance(0.6)) {
        group.forEach(k => add(k, 'L'));
      }
    });
  }
  if (d === 'expert') {
    for (const k of r.shuffle(SHAPE_KINDS)) {
      if (r.chance(0.4)) {
        add(k, 'S');
        add(k, 'L');
      }
    }
  }
  for (const k of r.shuffle(SHAPE_KINDS)) {
    add(k, 'L');
  }
  const ps = r.shuffle(pieces.slice(0, n));
  return {slots: r.shuffle(ps), pieces: r.shuffle(ps)};
}

// ---------- 5. Odd One Out ----------
export type OddRound = {items: string[]; odd: number; rotateOdd: boolean; cols: number};
export function genOdd(r: Rng, d: Difficulty, level: number): OddRound[] {
  const rounds: OddRound[] = [];
  for (let k = 0; k < 3; k++) {
    const n = d === 'easy' ? r.pick([4, 6, 9].slice(0, level <= 10 ? 1 : level <= 20 ? 2 : 3)) : d === 'hard' ? (level <= 15 ? 9 : 12) : level <= 15 ? 16 : 20;
    let base: string;
    let odd: string;
    let rotateOdd = false;
    if (d === 'easy') {
      const [ca, cb] = r.sample(CATEGORIES, 2);
      base = r.pick(ca);
      odd = r.pick(cb);
    } else if (d === 'hard') {
      const pair = r.pick(level > 20 ? [...SIMILAR_PAIRS, ...TRICKY_PAIRS.slice(0, 4)] : SIMILAR_PAIRS);
      [base, odd] = r.chance(0.5) ? pair : [pair[1], pair[0]];
    } else if (r.chance(0.35)) {
      base = r.pick(ASYMMETRIC);
      odd = base;
      rotateOdd = true;
    } else {
      const pair = r.pick(TRICKY_PAIRS);
      [base, odd] = r.chance(0.5) ? pair : [pair[1], pair[0]];
    }
    const items = new Array<string>(n).fill(base);
    const oi = r.int(0, n - 1);
    items[oi] = odd;
    const cols = n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
    rounds.push({items, odd: oi, rotateOdd, cols});
  }
  return rounds;
}

// ---------- 6. Pattern Builder ----------
const UNITS: Record<Difficulty, string[]> = {
  easy: ['AB', 'AB', 'AAB', 'ABB', 'AB', 'AAB', 'ABB', 'ABC'],
  hard: ['ABC', 'AABB', 'ABCC', 'ABAC', 'AABC', 'ABBC'],
  expert: ['ABCD', 'AABBC', 'ABCBA', 'ABACA', 'AABCC', 'ABCDD', 'ABBCD'],
};
export type PatternRound = {seq: string[]; blanks: number[]; options: string[]};
export function genPattern(r: Rng, d: Difficulty, level: number): PatternRound[] {
  const out: PatternRound[] = [];
  const pool = UNITS[d];
  const maxIdx = Math.max(1, Math.round(((level - 1) / 29) * (pool.length - 1)) + 1);
  for (let k = 0; k < 3; k++) {
    const unit = pool[r.int(0, Math.min(pool.length - 1, maxIdx))];
    const theme = r.pick(PATTERN_THEMES);
    const letters = Array.from(new Set(unit.split('')));
    const pickE = r.sample(theme, letters.length + 1);
    const map: Record<string, string> = {};
    letters.forEach((l, i) => (map[l] = pickE[i]));
    const reps = unit.length <= 2 ? 3 : 2;
    const seq: string[] = [];
    for (let i = 0; i < reps; i++) {
      unit.split('').forEach(l => seq.push(map[l]));
    }
    // add one more unit start so the end blank follows the rule
    seq.push(map[unit[0]]);
    let blanks: number[];
    if (d === 'easy') {
      blanks = [seq.length - 1];
    } else if (d === 'hard') {
      blanks = [r.chance(0.5) ? seq.length - 1 : r.int(unit.length, seq.length - 1)];
    } else {
      const a = r.int(unit.length, seq.length - 2);
      blanks = [a, seq.length - 1];
    }
    const correct = blanks.map(b => seq[b]);
    const optCount = d === 'easy' ? 3 : 4;
    const opts = new Set<string>(correct);
    for (const e of r.shuffle([...letters.map(l => map[l]), pickE[pickE.length - 1], ...theme])) {
      if (opts.size >= optCount) {
        break;
      }
      opts.add(e);
    }
    out.push({seq, blanks, options: r.shuffle(Array.from(opts))});
  }
  return out;
}

// ---------- 7. Maths Pop ----------
export type MathQ = {text: string; answer: number; options: number[]};
export function genMaths(r: Rng, d: Difficulty, level: number): MathQ[] {
  const out: MathQ[] = [];
  const balloons = d === 'easy' ? 4 : d === 'hard' ? 5 : 6;
  for (let k = 0; k < 5; k++) {
    let text = '';
    let answer = 0;
    if (d === 'easy') {
      const max = lerp(level, 5, 10);
      const a = r.int(0, max - 1);
      const b = r.int(1, max - a);
      text = `${a} + ${b}`;
      answer = a + b;
    } else if (d === 'hard') {
      const max = lerp(level, 10, 30);
      if (r.chance(0.5)) {
        const a = r.int(1, max - 1);
        const b = r.int(1, max - a);
        text = `${a} + ${b}`;
        answer = a + b;
      } else {
        const a = r.int(2, max);
        const b = r.int(1, a);
        text = `${a} − ${b}`;
        answer = a - b;
      }
    } else {
      const kind = r.int(0, 2);
      if (kind === 2) {
        const t = lerp(level, 5, 10);
        const a = r.int(2, t);
        const b = r.int(2, 10);
        text = `${a} × ${b}`;
        answer = a * b;
      } else {
        const max = lerp(level, 30, 100);
        if (kind === 0) {
          const a = r.int(5, max - 5);
          const b = r.int(2, max - a);
          text = `${a} + ${b}`;
          answer = a + b;
        } else {
          const a = r.int(10, max);
          const b = r.int(2, a - 1);
          text = `${a} − ${b}`;
          answer = a - b;
        }
      }
    }
    const opts = new Set<number>([answer]);
    let guard = 0;
    while (opts.size < balloons && guard++ < 100) {
      const v = answer + r.int(-5, 5);
      if (v >= 0) {
        opts.add(v);
      }
    }
    let extra = answer + 6;
    while (opts.size < balloons) {
      opts.add(extra++);
    }
    out.push({text, answer, options: r.shuffle(Array.from(opts))});
  }
  return out;
}

// ---------- 8. Spell It ----------
export type SpellRound = {word: Word; tiles: string[]; ghost: boolean};
export function genSpell(r: Rng, d: Difficulty, level: number): SpellRound[] {
  const pool = d === 'easy' ? (level > 20 ? [...WORDS_EASY, ...WORDS_MID.slice(0, 14)] : WORDS_EASY) : d === 'hard' ? WORDS_MID : WORDS_HARD;
  const words = r.sample(pool, 3);
  return words.map(word => {
    const letters = word.w.split('');
    if (d === 'expert') {
      const alpha = 'ABCDEFGHIJKLMNOPRSTUVWY';
      for (let i = 0; i < 2; i++) {
        letters.push(alpha[r.int(0, alpha.length - 1)]);
      }
    } else if (d === 'hard' && level > 15) {
      letters.push('AEIOU'[r.int(0, 4)]);
    }
    return {word, tiles: r.shuffle(letters), ghost: d === 'easy' && level <= 10};
  });
}

// ---------- 9. Spot the Difference ----------
export function genSpot(r: Rng, d: Difficulty, level: number) {
  const [rows, cols] = d === 'easy' ? (level <= 15 ? [3, 3] : [3, 4]) : d === 'hard' ? (level <= 15 ? [4, 4] : [4, 5]) : level <= 15 ? [5, 5] : [5, 6];
  const diffs = d === 'easy' ? lerp(level, 1, 3) : d === 'hard' ? lerp(level, 3, 4) : lerp(level, 4, 6);
  const n = rows * cols;
  const palette = r.sample(SCENE_EMOJI, Math.min(SCENE_EMOJI.length, d === 'easy' ? 10 : 16));
  const left = Array.from({length: n}, () => r.pick(palette));
  const right = left.slice();
  const cells = r.sample(Array.from({length: n}, (_, i) => i), diffs);
  cells.forEach(c => {
    let e = r.pick(SCENE_EMOJI);
    let guard = 0;
    while (e === left[c] && guard++ < 20) {
      e = r.pick(SCENE_EMOJI);
    }
    right[c] = e;
  });
  return {rows, cols, left, right, diffs: cells};
}

// ---------- 10. Maze ----------
export const WALL = {N: 1, E: 2, S: 4, W: 8};
export function genMaze(r: Rng, d: Difficulty, level: number) {
  const n = d === 'easy' ? lerp(level, 4, 7) : d === 'hard' ? lerp(level, 7, 10) : lerp(level, 10, 13);
  const walls = new Array<number>(n * n).fill(15);
  const seen = new Array<boolean>(n * n).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const row = Math.floor(c / n);
    const col = c % n;
    const opts: [number, number, number][] = [];
    if (row > 0 && !seen[c - n]) {
      opts.push([c - n, WALL.N, WALL.S]);
    }
    if (row < n - 1 && !seen[c + n]) {
      opts.push([c + n, WALL.S, WALL.N]);
    }
    if (col > 0 && !seen[c - 1]) {
      opts.push([c - 1, WALL.W, WALL.E]);
    }
    if (col < n - 1 && !seen[c + 1]) {
      opts.push([c + 1, WALL.E, WALL.W]);
    }
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [nx, w1, w2] = r.pick(opts);
    walls[c] &= ~w1;
    walls[nx] &= ~w2;
    seen[nx] = true;
    stack.push(nx);
  }
  const shortest = mazeDistance(walls, n, 0, n * n - 1);
  return {n, walls, shortest};
}

export function mazeDistance(walls: number[], n: number, from: number, to: number) {
  const dist = new Array<number>(n * n).fill(-1);
  dist[from] = 0;
  const q = [from];
  while (q.length) {
    const c = q.shift() as number;
    if (c === to) {
      return dist[c];
    }
    const steps: [number, number][] = [
      [WALL.N, c - n],
      [WALL.S, c + n],
      [WALL.W, c - 1],
      [WALL.E, c + 1],
    ];
    for (const [w, nx] of steps) {
      if (!(walls[c] & w) && dist[nx] === -1) {
        dist[nx] = dist[c] + 1;
        q.push(nx);
      }
    }
  }
  return -1;
}

// ---------- 11. Count & Tap ----------
export type CountRound = {grid: number; items: {pos: number; e: string}[]; target: string; answer: number; options: number[]};
export function genCount(r: Rng, d: Difficulty, level: number): CountRound[] {
  const out: CountRound[] = [];
  for (let k = 0; k < 3; k++) {
    const grid = d === 'easy' ? 5 : 6;
    const types = r.sample(COUNT_EMOJI, 3);
    const target = types[0];
    const answer = d === 'easy' ? r.int(lerp(level, 1, 4), lerp(level, 5, 10)) : d === 'hard' ? r.int(lerp(level, 4, 8), lerp(level, 8, 14)) : r.int(lerp(level, 8, 12), lerp(level, 12, 20));
    const items: {pos: number; e: string}[] = [];
    const extras = d === 'easy' ? 0 : d === 'hard' ? r.int(2, 6) : r.int(4, 8);
    const extras2 = d === 'expert' ? r.int(3, 6) : 0;
    const positions = r.sample(Array.from({length: grid * grid}, (_, i) => i), answer + extras + extras2);
    let p = 0;
    for (let i = 0; i < answer; i++) {
      items.push({pos: positions[p++], e: target});
    }
    for (let i = 0; i < extras; i++) {
      items.push({pos: positions[p++], e: types[1]});
    }
    for (let i = 0; i < extras2; i++) {
      items.push({pos: positions[p++], e: types[2]});
    }
    const optCount = d === 'easy' ? 3 : 4;
    const opts = new Set<number>([answer]);
    let guard = 0;
    while (opts.size < optCount && guard++ < 100) {
      const v = answer + r.int(-3, 3);
      if (v > 0) {
        opts.add(v);
      }
    }
    let extra = answer + 4;
    while (opts.size < optCount) {
      opts.add(extra++);
    }
    out.push({grid, items, target, answer, options: Array.from(opts).sort((a, b) => a - b)});
  }
  return out;
}

// ---------- 12. Sudoku Kids ----------
export function genSudoku(r: Rng, d: Difficulty, level: number) {
  const six = d === 'expert' || (d === 'hard' && level > 15);
  const h = 2;
  const w = six ? 3 : 2;
  const n = h * w;
  const blanks = d === 'easy' ? lerp(level, 4, 8) : d === 'hard' ? (six ? lerp(level - 15, 8, 18) : lerp(level * 2, 8, 11)) : lerp(level, 14, 24);
  // base pattern then shuffle rows within bands, bands, cols within stacks, stacks, symbols.
  const base = (row: number, col: number) => (w * (row % h) + Math.floor(row / h) + col) % n;
  const bandsCount = n / h;
  const stacksCount = n / w;
  const rowOrder: number[] = [];
  r.shuffle(Array.from({length: bandsCount}, (_, i) => i)).forEach(b =>
    r.shuffle(Array.from({length: h}, (_, i) => i)).forEach(x => rowOrder.push(b * h + x)),
  );
  const colOrder: number[] = [];
  r.shuffle(Array.from({length: stacksCount}, (_, i) => i)).forEach(s =>
    r.shuffle(Array.from({length: w}, (_, i) => i)).forEach(x => colOrder.push(s * w + x)),
  );
  const sym = r.shuffle(Array.from({length: n}, (_, i) => i));
  const solution: number[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      solution.push(sym[base(rowOrder[row], colOrder[col])]);
    }
  }
  const holes = new Set(r.sample(Array.from({length: n * n}, (_, i) => i), Math.min(blanks, n * n - n)));
  const givens = solution.map((v, i) => (holes.has(i) ? -1 : v));
  return {n, h, w, solution, givens};
}

/** Row/column/box conflict check for Sudoku. */
export function sudokuConflict(grid: number[], n: number, h: number, w: number, idx: number, v: number) {
  const row = Math.floor(idx / n);
  const col = idx % n;
  for (let k = 0; k < n; k++) {
    if (k !== col && grid[row * n + k] === v) {
      return true;
    }
    if (k !== row && grid[k * n + col] === v) {
      return true;
    }
  }
  const br = Math.floor(row / h) * h;
  const bc = Math.floor(col / w) * w;
  for (let rr = br; rr < br + h; rr++) {
    for (let cc = bc; cc < bc + w; cc++) {
      const j = rr * n + cc;
      if (j !== idx && grid[j] === v) {
        return true;
      }
    }
  }
  return false;
}
