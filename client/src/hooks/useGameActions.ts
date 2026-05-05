import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { getLegalTargets, isPromotionMove } from '../utils/chess';
import * as api from '../services/api';
import type { BoardSquare, PromotionPiece, PersonalityId } from '../types';

/**
 * Centralizes game interaction logic — square selection, move execution,
 * hints, resign — keeping components thin.
 */
export function useGameActions() {
  const {
    legalMoves,
    gameOver,
    moveLoading,
    turn,
    playerColor,
    gameMode,
    makeMove,
    undoMove,
    resetGame,
    setDifficulty,
    setPersonality,
    setGameMode,
    refreshEvaluation,
  } = useGameStore();

  const {
    selectedSquare,
    selectSquare,
    setLastMove,
    setHint,
    setPendingPromotion,
    flipBoard,
    openModal,
  } = useUiStore();

  // ── Square click handler ─────────────────────────────────────────────────

  const handleSquareClick = useCallback((square: BoardSquare) => {
    if (gameOver || moveLoading) return;

    // Only allow the current player to move (in AI mode, only their color)
    if (gameMode === 'ai' && turn !== playerColor) return;

    // Case 1: No piece selected yet — select this square if it has legal moves
    if (!selectedSquare) {
      const targets = getLegalTargets(square, legalMoves);
      if (targets.length > 0) {
        selectSquare(square, targets);
      }
      return;
    }

    // Case 2: Same square clicked — deselect
    if (selectedSquare === square) {
      selectSquare(null, []);
      return;
    }

    // Case 3: A different friendly piece — switch selection
    const targetsFromNew = getLegalTargets(square, legalMoves);
    const isOwnPiece = targetsFromNew.length > 0;
    const isValidTarget = legalMoves.some((m) => m.from === selectedSquare && m.to === square);

    if (!isValidTarget && isOwnPiece) {
      selectSquare(square, targetsFromNew);
      return;
    }

    // Case 4: Attempt a move
    if (isValidTarget) {
      if (isPromotionMove(selectedSquare, square, legalMoves)) {
        setPendingPromotion({ from: selectedSquare, to: square });
        openModal('promotion');
      } else {
        void executeMove(selectedSquare, square);
      }
      selectSquare(null, []);
    }
  }, [gameOver, moveLoading, gameMode, turn, playerColor, selectedSquare, legalMoves, selectSquare, setPendingPromotion, openModal]); // eslint-disable-line

  // ── Drag and drop handler ────────────────────────────────────────────────

  const handlePieceDrop = useCallback((sourceSquare: BoardSquare, targetSquare: BoardSquare): boolean => {
    if (gameOver || moveLoading) return false;
    if (gameMode === 'ai' && turn !== playerColor) return false;

    const isValid = legalMoves.some((m) => m.from === sourceSquare && m.to === targetSquare);
    if (!isValid) return false;

    if (isPromotionMove(sourceSquare, targetSquare, legalMoves)) {
      selectSquare(null, []);
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      openModal('promotion');
      return false; // Don't move piece yet — wait for promotion selection
    }

    void executeMove(sourceSquare, targetSquare);
    selectSquare(null, []);
    return true;
  }, [gameOver, moveLoading, gameMode, turn, playerColor, legalMoves, selectSquare, setPendingPromotion, openModal]); // eslint-disable-line

  // ── Promotion selection ──────────────────────────────────────────────────

  const handlePromotionSelect = useCallback(async (from: BoardSquare, to: BoardSquare, piece: PromotionPiece) => {
    await executeMove(from, to, piece);
  }, []); // eslint-disable-line

  // ── Internal move executor ────────────────────────────────────────────────

  async function executeMove(from: BoardSquare, to: BoardSquare, promotion?: PromotionPiece) {
    await makeMove(from, to, promotion);
    setLastMove(from, to);
    setHint(null);
    void refreshEvaluation();
  }

  // ── Game controls ─────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => void undoMove(), [undoMove]);

  const handleReset = useCallback(() => {
    void resetGame();
    setHint(null);
    selectSquare(null, []);
  }, [resetGame, setHint, selectSquare]);

  const handleFlip = useCallback(() => flipBoard(), [flipBoard]);

  const handleGetHint = useCallback(async () => {
    // Try the server first (uses Stockfish for best move)
    const response = await api.getHint();
    if (response.success && response.hint.from) {
      setHint(response.hint);
      return;
    }

    // Stockfish unavailable — fall back to a random legal move so something shows
    const uniqueMoves = legalMoves.reduce<Array<{ from: BoardSquare; to: BoardSquare }>>((acc, m) => {
      if (!acc.some((x) => x.from === m.from && x.to === m.to)) acc.push({ from: m.from, to: m.to });
      return acc;
    }, []);
    if (uniqueMoves.length > 0) {
      const pick = uniqueMoves[Math.floor(Math.random() * uniqueMoves.length)];
      setHint(pick);
    }
  }, [setHint, legalMoves]);

  const handleSetDifficulty = useCallback((level: number) => void setDifficulty(level), [setDifficulty]);

  const handleSetPersonality = useCallback((id: PersonalityId) => void setPersonality(id), [setPersonality]);

  const handleSetGameMode = useCallback((mode: 'ai' | 'pvp') => void setGameMode(mode), [setGameMode]);

  return {
    handleSquareClick,
    handlePieceDrop,
    handlePromotionSelect,
    handleUndo,
    handleReset,
    handleFlip,
    handleGetHint,
    handleSetDifficulty,
    handleSetPersonality,
    handleSetGameMode,
  };
}
