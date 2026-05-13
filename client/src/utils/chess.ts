import type { ChessMove, PieceColor, PieceType, BoardSquare, PromotionPiece } from '../types';
import { PIECE_VALUES } from '../constants';

// ── Material counting ──────────────────────────────────────────────────────

export interface CapturedPieces {
  white: PieceType[]; // captured from white (so black captured them)
  black: PieceType[]; // captured from black (so white captured them)
}

export function extractCapturedPieces(history: ChessMove[]): CapturedPieces {
  const captured: CapturedPieces = { white: [], black: [] };
  for (const move of history) {
    if (move.captured) {
      if (move.color === 'w') {
        captured.black.push(move.captured);
      } else {
        captured.white.push(move.captured);
      }
    }
  }
  return captured;
}

export function getMaterialAdvantage(captured: CapturedPieces): number {
  const whiteScore = captured.black.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  const blackScore = captured.white.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  return whiteScore - blackScore; // positive = white ahead
}

// ── Promotion detection ────────────────────────────────────────────────────

export function isPromotionMove(
  from: BoardSquare,
  to: BoardSquare,
  legalMoves: ChessMove[],
): boolean {
  return legalMoves.some(
    (m) => m.from === from && m.to === to && m.promotion !== undefined,
  );
}

export function getPromotionTargetSquare(
  from: BoardSquare,
  to: BoardSquare,
  legalMoves: ChessMove[],
  piece: PromotionPiece,
): ChessMove | undefined {
  return legalMoves.find((m) => m.from === from && m.to === to && m.promotion === piece);
}

// ── Legal move helpers ─────────────────────────────────────────────────────

export function getLegalTargets(square: BoardSquare, legalMoves: ChessMove[]): BoardSquare[] {
  const seen = new Set<BoardSquare>();
  const targets: BoardSquare[] = [];
  for (const move of legalMoves) {
    if (move.from === square && !seen.has(move.to)) {
      seen.add(move.to);
      targets.push(move.to);
    }
  }
  return targets;
}

export function isOccupied(square: BoardSquare, legalMoves: ChessMove[]): boolean {
  return legalMoves.some((m) => m.to === square && m.flags.includes('c'));
}

// ── Evaluation formatting ──────────────────────────────────────────────────

export function formatEvaluation(score: number): string {
  if (score === 0) return '0.0';
  if (score > 900) return `M${Math.ceil((1000 - score) / 2)}`;
  if (score < -900) return `-M${Math.ceil((1000 + score) / 2)}`;
  const formatted = (score / 100).toFixed(1);
  return score > 0 ? `+${formatted}` : formatted;
}

export function evalToPercent(score: number): number {
  // Sigmoid-like function mapping eval to 0-100 (50 = equal)
  const clamped = Math.max(-1000, Math.min(1000, score));
  return 50 + (50 * clamped) / (Math.abs(clamped) + 100);
}

// ── Time formatting ────────────────────────────────────────────────────────

export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Color utilities ────────────────────────────────────────────────────────

export function getColorLabel(color: PieceColor): string {
  return color === 'w' ? 'White' : 'Black';
}

export function getOpponentColor(color: PieceColor): PieceColor {
  return color === 'w' ? 'b' : 'w';
}

// ── FEN utilities ──────────────────────────────────────────────────────────

export function extractTurnFromFen(fen: string): PieceColor {
  return (fen.split(' ')[1] as PieceColor) ?? 'w';
}
