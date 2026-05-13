import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatTime, getColorLabel, getMaterialAdvantage, extractCapturedPieces } from '../../utils/chess';
import type { PieceColor } from '../../types';
import styles from './GameInfo.module.css';

export const GameInfo = memo(function GameInfo() {
  const { turn, gameOver, inCheck, result, history, playerColor, gameMode } = useGameStore();

  const captured = extractCapturedPieces(history);
  const advantage = getMaterialAdvantage(captured);

  const isPlayerTurn = gameMode === 'pvp' || turn === playerColor;
  const activeColorLabel = getColorLabel(turn);

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        {gameOver ? (
          <div className={styles.gameOverBadge}>{result ?? 'Game Over'}</div>
        ) : (
          <div className={`${styles.turnIndicator} ${isPlayerTurn ? styles.playerTurn : styles.opponentTurn}`}>
            <span className={`${styles.dot} ${turn === 'w' ? styles.white : styles.black}`} aria-hidden="true" />
            <span>
              {inCheck ? (
                <><strong>{activeColorLabel}</strong> is in check!</>
              ) : (
                <>{activeColorLabel}&apos;s turn</>
              )}
            </span>
          </div>
        )}
      </div>

      {Math.abs(advantage) >= 1 && (
        <div className={styles.advantage} aria-label={`Material advantage: ${advantage > 0 ? 'White' : 'Black'} +${Math.abs(advantage)}`}>
          <span className={advantage > 0 ? styles.whiteAdv : styles.blackAdv}>
            {advantage > 0 ? '♙' : '♟'} +{Math.abs(advantage)}
          </span>
        </div>
      )}
    </div>
  );
});

// ── Clock display ──────────────────────────────────────────────────────────

interface ClockProps {
  seconds: number;
  active: boolean;
  color: PieceColor;
  label: string;
}

export const Clock = memo(function Clock({ seconds, active, color, label }: ClockProps) {
  const isLow = seconds > 0 && seconds < 30;
  return (
    <div
      className={`${styles.clock} ${active ? styles.clockActive : ''} ${isLow ? styles.clockLow : ''}`}
      aria-label={`${label}: ${formatTime(seconds)}`}
    >
      <span className={`${styles.clockDot} ${color === 'w' ? styles.white : styles.black}`} aria-hidden="true" />
      <span className={styles.clockLabel}>{label}</span>
      <span className={styles.clockTime}>{formatTime(seconds)}</span>
    </div>
  );
});
