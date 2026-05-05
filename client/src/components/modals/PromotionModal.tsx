import { memo, useCallback } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useGameActions } from '../../hooks/useGameActions';
import type { PromotionPiece } from '../../types';
import styles from './PromotionModal.module.css';

const PROMOTION_OPTIONS: Array<{ piece: PromotionPiece; symbol: string; label: string }> = [
  { piece: 'q', symbol: '♕', label: 'Queen' },
  { piece: 'r', symbol: '♖', label: 'Rook' },
  { piece: 'b', symbol: '♗', label: 'Bishop' },
  { piece: 'n', symbol: '♘', label: 'Knight' },
];

export const PromotionModal = memo(function PromotionModal() {
  const { pendingPromotion, activeModal, closeModal, setPendingPromotion } = useUiStore();
  const { handlePromotionSelect } = useGameActions();

  if (activeModal !== 'promotion' || !pendingPromotion) return null;

  const handleSelect = (piece: PromotionPiece) => {
    void handlePromotionSelect(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
    closeModal();
  };

  const handleCancel = useCallback(() => {
    setPendingPromotion(null);
    closeModal();
  }, [setPendingPromotion, closeModal]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Choose promotion piece"
      onClick={handleCancel}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Choose piece</h2>
        <p className={styles.subtitle}>Pawn promoted — select a piece</p>
        <div className={styles.options} role="group" aria-label="Promotion options">
          {PROMOTION_OPTIONS.map(({ piece, symbol, label }) => (
            <button
              key={piece}
              className={styles.option}
              onClick={() => handleSelect(piece)}
              aria-label={`Promote to ${label}`}
              autoFocus={piece === 'q'}
            >
              <span className={styles.pieceSymbol} aria-hidden="true">
                {symbol}
              </span>
              <span className={styles.pieceLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
