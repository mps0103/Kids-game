import {GameDef} from '../core/types';
import ConnectDots from './ConnectDots';
import CountTap from './CountTap';
import MathsPop from './MathsPop';
import MazeRunner from './MazeRunner';
import MemoryMatch from './MemoryMatch';
import OddOneOut from './OddOneOut';
import PatternBuilder from './PatternBuilder';
import ShapePuzzle from './ShapePuzzle';
import SimonColours from './SimonColours';
import SpellIt from './SpellIt';
import SpotDifference from './SpotDifference';
import SudokuKids from './SudokuKids';

export const GAMES: GameDef[] = [
  {id: 'memory', title: 'Memory Match', emoji: '🃏', skill: 'Memory', howTo: 'Flip two cards at a time and find all the pairs.', color: '#FF5FA2', Component: MemoryMatch},
  {id: 'simon', title: 'Simon Says', emoji: '🎵', skill: 'Focus', howTo: 'Watch the fruits light up, then tap them in the same order.', color: '#7C5CFF', Component: SimonColours},
  {id: 'flow', title: 'Connect Dots', emoji: '🔗', skill: 'Planning', howTo: 'Draw lines to join same-coloured dots without crossing.', color: '#3FA9F5', Component: ConnectDots},
  {id: 'shapes', title: 'Shape Puzzle', emoji: '🧩', skill: 'Shapes', howTo: 'Drag every shape into its matching shadow.', color: '#2ECC71', Component: ShapePuzzle},
  {id: 'odd', title: 'Odd One Out', emoji: '🔍', skill: 'Logic', howTo: 'Look closely and tap the one that is different.', color: '#FF9A3C', Component: OddOneOut},
  {id: 'pattern', title: 'Patterns', emoji: '🧠', skill: 'Sequencing', howTo: 'Work out the rule and pick what comes next.', color: '#B86BFF', Component: PatternBuilder},
  {id: 'maths', title: 'Maths Pop', emoji: '🎈', skill: 'Maths', howTo: 'Solve the sum and pop the balloon with the answer.', color: '#FF5A5F', Component: MathsPop},
  {id: 'spell', title: 'Spell It', emoji: '✏️', skill: 'Spelling', howTo: 'Tap the letters in order to spell the picture.', color: '#00B8D9', Component: SpellIt},
  {id: 'spot', title: 'Spot It', emoji: '🔎', skill: 'Attention', howTo: 'Find what is different between the two pictures.', color: '#3DDCB4', Component: SpotDifference},
  {id: 'maze', title: 'Maze Runner', emoji: '🐥', skill: 'Problem solving', howTo: 'Help the chick find the way to the star.', color: '#FFB400', Component: MazeRunner},
  {id: 'count', title: 'Count & Tap', emoji: '🔢', skill: 'Numbers', howTo: 'Count the pictures and tap the right number.', color: '#FF7AB6', Component: CountTap},
  {id: 'sudoku', title: 'Fruit Sudoku', emoji: '🍓', skill: 'Logic', howTo: 'Fill the grid so each row, column and box has every fruit once.', color: '#5B8CFF', Component: SudokuKids},
];

export const gameById = (id: string) => GAMES.find(g => g.id === id) as GameDef;
