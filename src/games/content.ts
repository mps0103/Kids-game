// Emoji pools and word lists used by the games.

export const CARD_EMOJI = [
  '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧',
  '🐙', '🦋', '🐢', '🐬', '🍎', '🍌', '🍓', '🍇', '🍉', '🍒', '🍍', '🥕', '🚗', '🚀', '⚽', '🎈',
];

export const CATEGORIES: string[][] = [
  ['🐶', '🐱', '🐰', '🐻', '🐼', '🐯', '🦁', '🐮', '🐷', '🐸'],
  ['🍎', '🍌', '🍓', '🍇', '🍉', '🍒', '🍍', '🍑', '🍋', '🥝'],
  ['🚗', '🚌', '🚀', '✈️', '🚲', '🚂', '🚁', '⛵', '🚒', '🚜'],
  ['⚽', '🏀', '🎾', '🏐', '🏈', '🎱', '🏓', '🥎'],
  ['🌸', '🌻', '🌷', '🌹', '🌼', '🌺', '🍀', '🌵'],
  ['⭐', '🌙', '☀️', '☁️', '🌈', '⚡', '❄️', '🔥'],
];

// Pairs that look alike — used for the harder "odd one out" levels.
export const SIMILAR_PAIRS: [string, string][] = [
  ['🍎', '🍅'], ['🐱', '🐯'], ['⭐', '🌟'], ['🚗', '🚙'], ['🐟', '🐠'], ['🌷', '🌹'],
  ['🍊', '🍑'], ['😺', '😸'], ['🌲', '🌳'], ['🐝', '🪲'], ['💙', '💜'], ['🐻', '🧸'],
  ['🍋', '🍌'], ['🐭', '🐹'], ['🦆', '🐤'], ['🌕', '🌝'],
];

export const TRICKY_PAIRS: [string, string][] = [
  ['😀', '😃'], ['😊', '🙂'], ['🌲', '🎄'], ['🌕', '🌖'], ['🕐', '🕑'], ['🔵', '🟣'],
  ['❤️', '🧡'], ['🌑', '🌚'], ['😺', '😸'], ['🐶', '🐕'], ['🐈', '🐱'], ['🟢', '🟩'],
];

// Emojis that look clearly different when turned upside-down.
export const ASYMMETRIC = ['🐌', '🦒', '🐕', '🐘', '🦕', '🚗', '🚂', '🦜', '🐢', '🐈', '🐖', '🦀'];

export const PATTERN_THEMES: string[][] = [
  ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'],
  ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉'],
  ['🐶', '🐱', '🐰', '🐸', '🐼', '🦊'],
  ['⭐', '🌙', '☀️', '☁️', '⚡', '❄️'],
  ['🟥', '🟦', '🟩', '🟨', '🟪', '🟧'],
  ['❤️', '💙', '💚', '💛', '💜', '🧡'],
];

export const SCENE_EMOJI = [
  '🌳', '🌸', '🍄', '🐞', '🦋', '🐝', '🐦', '🌻', '🐿️', '🦔', '🍎', '🌼', '🐌', '🌵', '🐸', '🌈',
  '☀️', '☁️', '🏠', '🚲', '🎈', '🪁', '⚽', '🐟', '🦆', '🐢', '🍓', '🌙',
];

export type Word = {w: string; e: string};

export const WORDS_EASY: Word[] = [
  {w: 'CAT', e: '🐱'}, {w: 'DOG', e: '🐶'}, {w: 'SUN', e: '☀️'}, {w: 'BUS', e: '🚌'},
  {w: 'CUP', e: '🥤'}, {w: 'HAT', e: '🎩'}, {w: 'PIG', e: '🐷'}, {w: 'COW', e: '🐮'},
  {w: 'BEE', e: '🐝'}, {w: 'EGG', e: '🥚'}, {w: 'FOX', e: '🦊'}, {w: 'OWL', e: '🦉'},
  {w: 'CAR', e: '🚗'}, {w: 'BED', e: '🛏️'}, {w: 'KEY', e: '🔑'}, {w: 'ANT', e: '🐜'},
  {w: 'BAT', e: '🦇'}, {w: 'MAP', e: '🗺️'}, {w: 'PEN', e: '🖊️'}, {w: 'BOX', e: '📦'},
  {w: 'ICE', e: '🧊'}, {w: 'NUT', e: '🥜'}, {w: 'RAT', e: '🐀'}, {w: 'HEN', e: '🐔'},
];

export const WORDS_MID: Word[] = [
  {w: 'FISH', e: '🐟'}, {w: 'FROG', e: '🐸'}, {w: 'DUCK', e: '🦆'}, {w: 'CAKE', e: '🎂'},
  {w: 'STAR', e: '⭐'}, {w: 'MOON', e: '🌙'}, {w: 'TREE', e: '🌳'}, {w: 'BALL', e: '⚽'},
  {w: 'BEAR', e: '🐻'}, {w: 'LION', e: '🦁'}, {w: 'BOOK', e: '📖'}, {w: 'KITE', e: '🪁'},
  {w: 'SHOE', e: '👟'}, {w: 'RAIN', e: '🌧️'}, {w: 'APPLE', e: '🍎'}, {w: 'HOUSE', e: '🏠'},
  {w: 'TRAIN', e: '🚆'}, {w: 'HORSE', e: '🐴'}, {w: 'TIGER', e: '🐯'}, {w: 'ZEBRA', e: '🦓'},
  {w: 'GRAPE', e: '🍇'}, {w: 'SNAKE', e: '🐍'}, {w: 'CHAIR', e: '🪑'}, {w: 'CLOCK', e: '⏰'},
  {w: 'BREAD', e: '🍞'}, {w: 'WHALE', e: '🐳'}, {w: 'MOUSE', e: '🐭'}, {w: 'SHEEP', e: '🐑'},
];

export const WORDS_HARD: Word[] = [
  {w: 'RABBIT', e: '🐰'}, {w: 'MONKEY', e: '🐵'}, {w: 'BANANA', e: '🍌'}, {w: 'ROCKET', e: '🚀'},
  {w: 'FLOWER', e: '🌸'}, {w: 'TURTLE', e: '🐢'}, {w: 'ORANGE', e: '🍊'}, {w: 'PENCIL', e: '✏️'},
  {w: 'GUITAR', e: '🎸'}, {w: 'CAMERA', e: '📷'}, {w: 'DRAGON', e: '🐉'}, {w: 'PENGUIN', e: '🐧'},
  {w: 'GIRAFFE', e: '🦒'}, {w: 'OCTOPUS', e: '🐙'}, {w: 'DOLPHIN', e: '🐬'}, {w: 'RAINBOW', e: '🌈'},
  {w: 'ELEPHANT', e: '🐘'}, {w: 'UMBRELLA', e: '☂️'}, {w: 'PUMPKIN', e: '🎃'}, {w: 'BUTTERFLY', e: '🦋'},
  {w: 'CARROT', e: '🥕'}, {w: 'CHEESE', e: '🧀'}, {w: 'PIZZA', e: '🍕'}, {w: 'ROBOT', e: '🤖'},
];

export const COUNT_EMOJI = ['🍎', '🐟', '⭐', '🎈', '🐞', '🍓', '🐥', '🌸', '🚗', '🍪', '🦋', '⚽'];

export const SUDOKU_SYMBOLS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝'];

export const STICKERS = [
  '🦄', '🐉', '🦖', '🦕', '🐳', '🦈', '🐙', '🦑', '🦀', '🐠', '🦩', '🦚', '🦜', '🦉', '🐧', '🐨',
  '🐼', '🦥', '🦦', '🦔', '🐿️', '🦊', '🦁', '🐯', '🦓', '🦒', '🐘', '🦛', '🦏', '🐪', '🦘', '🐎',
  '🚀', '🛸', '🚁', '🚂', '🏎️', '🚒', '⛵', '🎡', '🎢', '🏰', '🌋', '🌈', '⭐', '🌙', '🪐', '☄️',
  '🍩', '🍦', '🧁', '🍭', '🍉', '🍓', '🎂', '🍕', '🎸', '🥁', '🎨', '🏆',
];

/** Stars needed to unlock sticker i. */
export const stickerCost = (i: number) => 5 + i * 15;
