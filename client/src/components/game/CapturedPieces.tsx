import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { extractCapturedPieces, getMaterialAdvantage } from '../../utils/chess';
import type { PieceType } from '../../types';
import styles from './CapturedPieces.module.css';

const PIECE_UNICODE: Record<PieceType, { white: string; black: string }> = {
  p: { white: '♙', black: '♟' },
  n: { white: '♘', black: '♞' },
  b: { white: '♗', black: '♝' },
  r: { white: '♖', black: '♜' },
  q: { white: '♕', black: '♛' },
  k: { white: '♔', black: '♚' },
};

const PIECE_ORDER: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

interface PieceRowProps {
  pieces: PieceType[];
  color: 'white' | 'black';
  label: string;
}

const PieceRow = memo(function PieceRow({ pieces, color, label }: PieceRowProps) {
  const sorted = [...pieces].sort((a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b));

  return (
    <div className={styles.row} aria-label={label}>
      <span className={`${styles.colorDot} ${styles[color]}`} aria-hidden="true" />
      <span className={styles.pieces} aria-label={`${label}: ${sorted.map((p) => p).join(', ')}`}>
        {sorted.length > 0
          ? sorted.map((piece, i) => (
              <span key={i} className={styles.piece} aria-hidden="true">
                {color === 'white' ? PIECE_UNICODE[piece].white : PIECE_UNICODE[piece].black}
              </span>
            ))
          : <span className={styles.empty}>—</span>}
      </span>
    </div>
  );
});

export const CapturedPieces = memo(function CapturedPieces() {
  const { history } = useGameStore();
  const captured = extractCapturedPieces(history);
  const advantage = getMaterialAdvantage(captured);

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Captured</h3>
      <div className={styles.rows}>
        <PieceRow pieces={captured.black} color="white" label="White captured" />
        <PieceRow pieces={captured.white} color="black" label="Black captured" />
      </div>
      {Math.abs(advantage) >= 1 && (
        <div className={styles.balance} aria-label={`Material balance: ${advantage > 0 ? 'White' : 'Black'} leads by ${Math.abs(advantage)}`}>
          <span className={advantage > 0 ? styles.whiteAdv : styles.blackAdv}>
            {advantage > 0 ? 'White' : 'Black'} +{Math.abs(advantage)}
          </span>
        </div>
      )}
    </div>
  );
});
