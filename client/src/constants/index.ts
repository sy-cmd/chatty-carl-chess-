import type { BoardTheme, PersonalityId } from '../types';

export const API_BASE = '/api';

// ── Board themes ───────────────────────────────────────────────────────────

export const BOARD_THEMES: Record<BoardTheme, { light: Record<string, string>; dark: Record<string, string> }> = {
  classic: {
    light: { backgroundColor: '#f0d9b5' },
    dark: { backgroundColor: '#b58863' },
  },
  blue: {
    light: { backgroundColor: '#dee3e6' },
    dark: { backgroundColor: '#8ca2ad' },
  },
  wood: {
    light: { backgroundColor: '#f0d4a0' },
    dark: { backgroundColor: '#7b4f28' },
  },
  purple: {
    light: { backgroundColor: '#e8d5f0' },
    dark: { backgroundColor: '#7c4f96' },
  },
  dark: {
    light: { backgroundColor: '#6f737c' },
    dark: { backgroundColor: '#3d4046' },
  },
};

export const BOARD_THEME_LABELS: Record<BoardTheme, string> = {
  classic: 'Classic',
  blue: 'Blue',
  wood: 'Wood',
  purple: 'Purple',
  dark: 'Dark',
};

// ── Difficulty ─────────────────────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  3: 'Easy',
  5: 'Casual',
  8: 'Intermediate',
  10: 'Club Player',
  13: 'Advanced',
  15: 'Expert',
  18: 'Master',
  20: 'Grandmaster',
};

export const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

// ── Time controls ──────────────────────────────────────────────────────────

export const TIME_CONTROLS = [
  { value: 0, label: 'Untimed' },
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
  { value: 900, label: '15 min' },
  { value: 1800, label: '30 min' },
];

// ── Piece values (for material count) ─────────────────────────────────────

export const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
} as const;

// ── Personality display names ──────────────────────────────────────────────

export const PERSONALITY_LABELS: Record<PersonalityId, string> = {
  sassy: 'Sassy Sarah',
  grandma: 'Grandma Gladys',
  commentator: 'Commentator Carl',
  sydney: 'Trash Talker Tony',
  confused: 'Confused Carl',
};

// ── Square highlight colors ────────────────────────────────────────────────

export const HIGHLIGHT = {
  selected: 'rgba(255, 215, 0, 0.5)',
  legalMove: 'radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)',
  legalCapture: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.15) 60%)',
  lastMove: 'rgba(255, 255, 0, 0.25)',
  hint: 'rgba(50, 150, 255, 0.5)',
  check: 'rgba(220, 50, 50, 0.5)',
} as const;
