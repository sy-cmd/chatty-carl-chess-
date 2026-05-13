import { create } from 'zustand';
import type {
  GameState,
  ChessMove,
  PieceColor,
  PersonalityId,
  GameMode,
  MakeMoveRequest,
  PromotionPiece,
  BoardSquare,
} from '../types';
import * as api from '../services/api';

// ── State shape ────────────────────────────────────────────────────────────

interface GameStore {
  // Board state (source of truth from server)
  fen: string;
  turn: PieceColor;
  gameOver: boolean;
  inCheck: boolean;
  result: string | null;
  history: ChessMove[];
  legalMoves: ChessMove[];

  // Commentary
  commentary: string | null;
  commentaryLoading: boolean;
  lastMistake: boolean;
  lastBlunder: boolean;

  // Position evaluation (from /api/evaluate)
  evaluation: number;

  // Settings (synced with server session)
  difficulty: number;
  personality: PersonalityId;
  gameMode: GameMode;
  playerColor: PieceColor;

  // Loading / error
  moveLoading: boolean;
  error: string | null;

  // ── Actions ──────────────────────────────────────────────────────────────
  loadState: () => Promise<void>;
  makeMove: (from: BoardSquare, to: BoardSquare, promotion?: PromotionPiece) => Promise<void>;
  requestAIMove: () => Promise<void>;
  undoMove: () => Promise<void>;
  resetGame: () => Promise<void>;
  setDifficulty: (level: number) => Promise<void>;
  setPersonality: (id: PersonalityId) => Promise<void>;
  setGameMode: (mode: GameMode, color?: PieceColor) => Promise<void>;
  refreshEvaluation: () => Promise<void>;
  applyState: (state: GameState) => void;
  clearError: () => void;
}

// ── Store implementation ───────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial values
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'w',
  gameOver: false,
  inCheck: false,
  result: null,
  history: [],
  legalMoves: [],
  commentary: null,
  commentaryLoading: false,
  lastMistake: false,
  lastBlunder: false,
  evaluation: 0,
  difficulty: 10,
  personality: 'sassy',
  gameMode: 'ai',
  playerColor: 'w',
  moveLoading: false,
  error: null,

  // ── Hydrate from server ──────────────────────────────────────────────────

  loadState: async () => {
    try {
      const state = await api.fetchGameState();
      get().applyState(state);
      const modeData = await api.fetchGameMode();
      set({
        gameMode: modeData.mode,
        playerColor: (modeData.playerColor === 'white' ? 'w' : 'b') as PieceColor,
      });
    } catch {
      set({ error: 'Failed to load game state. Is the server running?' });
    }
  },

  // ── Player move ──────────────────────────────────────────────────────────

  makeMove: async (from, to, promotion) => {
    if (get().moveLoading || get().gameOver) return;
    set({ moveLoading: true, error: null, commentary: null, lastMistake: false, lastBlunder: false });

    const request: MakeMoveRequest = { from, to, promotion, difficulty: get().difficulty };
    const { gameMode, playerColor } = get();

    const response = gameMode === 'pvp'
      ? await api.makePvpMove(request)
      : await api.makeMove(request);

    if (!response.success) {
      set({ moveLoading: false, error: response.error ?? 'Invalid move' });
      return;
    }

    set({
      commentary: response.llmComment ?? null,
      lastMistake: response.mistakeDetected ?? false,
      lastBlunder: response.blunderDetected ?? false,
    });

    get().applyState(response.state);
    set({ moveLoading: false });

    // In AI mode, automatically trigger the AI's response move
    const { gameOver, turn } = get();
    if (gameMode === 'ai' && !gameOver && turn !== playerColor) {
      await get().requestAIMove();
    }
  },

  // ── AI move ──────────────────────────────────────────────────────────────

  requestAIMove: async () => {
    if (get().moveLoading || get().gameOver) return;
    set({ moveLoading: true, commentaryLoading: true, error: null });

    const response = await api.requestAIMove(get().difficulty);

    if (!response.success) {
      // AI move failure is non-fatal — log a warning but don't block the game
      console.warn('[AI move failed]', response.error);
      set({ moveLoading: false, commentaryLoading: false });
      return;
    }

    set({
      commentary: response.llmComment ?? null,
      commentaryLoading: false,
      lastMistake: response.mistakeDetected ?? false,
      lastBlunder: response.blunderDetected ?? false,
    });

    get().applyState(response.state);
    set({ moveLoading: false });
  },

  // ── Undo ─────────────────────────────────────────────────────────────────

  undoMove: async () => {
    if (get().moveLoading) return;
    set({ moveLoading: true, error: null });

    const response = await api.undoMove();
    if (response.success) {
      get().applyState(response.state);
      set({ commentary: null });
    } else {
      set({ error: response.error ?? 'Cannot undo' });
    }
    set({ moveLoading: false });
  },

  // ── Reset ─────────────────────────────────────────────────────────────────

  resetGame: async () => {
    set({ moveLoading: true, error: null });
    try {
      const state = await api.resetGame();
      get().applyState(state);
      set({ commentary: null, evaluation: 0, lastMistake: false, lastBlunder: false });
    } catch {
      set({ error: 'Failed to reset game' });
    }
    set({ moveLoading: false });
  },

  // ── Settings ──────────────────────────────────────────────────────────────

  setDifficulty: async (level) => {
    await api.setDifficulty(level);
    set({ difficulty: level });
  },

  setPersonality: async (id) => {
    await api.setPersonality(id);
    set({ personality: id });
  },

  setGameMode: async (mode, color) => {
    const response = await api.setGameMode(mode, color);
    set({
      gameMode: response.mode,
      playerColor: (response.playerColor === 'white' ? 'w' : 'b') as PieceColor,
    });
  },

  // ── Evaluation ────────────────────────────────────────────────────────────

  refreshEvaluation: async () => {
    try {
      const { score } = await api.getEvaluation();
      set({ evaluation: score });
    } catch {
      // Non-critical — silently ignore
    }
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

  applyState: (state: GameState) => {
    set({
      fen: state.fen,
      turn: state.turn,
      gameOver: state.gameOver,
      inCheck: state.inCheck,
      result: state.result,
      history: state.history,
      legalMoves: state.legalMoves,
    });
  },

  clearError: () => set({ error: null }),
}));
