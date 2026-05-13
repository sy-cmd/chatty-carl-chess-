import { useCallback, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import { useGameActions } from '../../hooks/useGameActions';
import { BOARD_THEMES, HIGHLIGHT } from '../../constants';
import { isOccupied } from '../../utils/chess';
import styles from './ChessBoard.module.css';

export function ChessBoard() {
  const { fen, legalMoves, inCheck, turn, moveLoading, gameOver } = useGameStore();
  const {
    selectedSquare,
    legalTargets,
    lastMoveSquares,
    hintSquares,
    boardFlipped,
    boardTheme,
  } = useUiStore();

  const { handleSquareClick, handlePieceDrop } = useGameActions();

  // In react-chessboard 4.7+, clicking a piece fires onPieceClick(piece, square)
  // and does NOT reliably bubble to onSquareClick. Wire both so either path works.
  const handlePieceClick = useCallback(
    (_piece: string, square: string) => handleSquareClick(square),
    [handleSquareClick],
  );

  // ── Build custom square styles ─────────────────────────────────────────

  const customSquareStyles = useMemo<Record<string, CSSProperties>>(() => {
    const squareStyles: Record<string, CSSProperties> = {};

    // Last move highlight
    if (lastMoveSquares) {
      const lastMoveStyle: CSSProperties = { backgroundColor: HIGHLIGHT.lastMove };
      squareStyles[lastMoveSquares.from] = lastMoveStyle;
      squareStyles[lastMoveSquares.to] = lastMoveStyle;
    }

    // Selected piece
    if (selectedSquare) {
      squareStyles[selectedSquare] = { backgroundColor: HIGHLIGHT.selected };
    }

    // Legal move targets
    for (const target of legalTargets) {
      const isCapture = isOccupied(target, legalMoves);
      squareStyles[target] = {
        background: isCapture ? HIGHLIGHT.legalCapture : HIGHLIGHT.legalMove,
        ...(squareStyles[target] ?? {}),
      };
    }

    // Hint
    if (hintSquares) {
      squareStyles[hintSquares.from] = { backgroundColor: HIGHLIGHT.hint };
      squareStyles[hintSquares.to] = { backgroundColor: HIGHLIGHT.hint };
    }

    // King in check
    if (inCheck) {
      const kingSquare = findKingSquare(fen, turn);
      if (kingSquare) {
        squareStyles[kingSquare] = { backgroundColor: HIGHLIGHT.check };
      }
    }

    return squareStyles;
  }, [selectedSquare, legalTargets, lastMoveSquares, hintSquares, inCheck, fen, turn, legalMoves]);

  const theme = BOARD_THEMES[boardTheme];
  const draggable = !moveLoading && !gameOver;

  return (
    <div className={styles.container} role="region" aria-label="Chess board">
      <Chessboard
        position={fen}
        onSquareClick={handleSquareClick}
        onPieceClick={handlePieceClick}
        onPieceDrop={handlePieceDrop}
        boardOrientation={boardFlipped ? 'black' : 'white'}
        customSquareStyles={customSquareStyles}
        customDarkSquareStyle={theme.dark}
        customLightSquareStyle={theme.light}
        animationDuration={180}
        arePiecesDraggable={draggable}
        areArrowsAllowed={false}
        showBoardNotation={true}
      />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function findKingSquare(fen: string, color: 'w' | 'b'): string | null {
  const target = color === 'w' ? 'K' : 'k';
  const rows = fen.split(' ')[0].split('/');
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const ch of rows[rank]) {
      const n = parseInt(ch, 10);
      if (!isNaN(n)) {
        file += n;
      } else {
        if (ch === target) {
          return `${'abcdefgh'[file]}${8 - rank}`;
        }
        file++;
      }
    }
  }
  return null;
}
