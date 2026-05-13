import { memo, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import { useGameActions } from '../../hooks/useGameActions';
import { Button } from '../ui/Button';
import styles from './GameOverModal.module.css';

export const GameOverModal = memo(function GameOverModal() {
  const { gameOver, result, history, moveLoading } = useGameStore();
  const { activeModal, openModal, closeModal } = useUiStore();
  const { handleReset } = useGameActions();

  // Auto-open when game ends
  useEffect(() => {
    if (gameOver && result) {
      const timeout = setTimeout(() => openModal('gameOver'), 800);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [gameOver, result, openModal]);

  if (activeModal !== 'gameOver') return null;

  const totalMoves = history.length;

  const resultEmoji = (() => {
    if (!result) return '🏁';
    if (result.includes('White wins')) return '♔';
    if (result.includes('Black wins')) return '♚';
    return '🤝';
  })();

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Game over"
      onClick={closeModal}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.emoji} aria-hidden="true">{resultEmoji}</div>
        <h2 className={styles.title}>Game Over</h2>
        {result && <p className={styles.result}>{result}</p>}
        <p className={styles.detail}>
          {totalMoves} move{totalMoves !== 1 ? 's' : ''} played
        </p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => { handleReset(); closeModal(); }}
            loading={moveLoading}
            autoFocus
          >
            Play Again
          </Button>
          <Button variant="ghost" size="lg" onClick={closeModal}>
            Review Game
          </Button>
        </div>
      </div>
    </div>
  );
});
