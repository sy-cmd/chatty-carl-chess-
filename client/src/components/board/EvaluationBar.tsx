import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import { evalToPercent, formatEvaluation } from '../../utils/chess';
import styles from './EvaluationBar.module.css';

export const EvaluationBar = memo(function EvaluationBar() {
  const { evaluation, gameOver } = useGameStore();
  const { boardFlipped } = useUiStore();

  const whitePercent = evalToPercent(evaluation);
  const label = formatEvaluation(evaluation);

  const whiteStyle = boardFlipped
    ? { height: `${100 - whitePercent}%` }
    : { height: `${whitePercent}%` };

  return (
    <div
      className={styles.bar}
      role="meter"
      aria-valuenow={evaluation}
      aria-valuemin={-1000}
      aria-valuemax={1000}
      aria-label={`Position evaluation: ${label}`}
      title={`Evaluation: ${label}`}
    >
      <div
        className={`${styles.fill} ${gameOver ? styles.gameOver : ''}`}
        style={whiteStyle}
      />
      <span className={`${styles.label} ${evaluation > 0 ? styles.labelWhite : styles.labelBlack}`}>
        {label}
      </span>
    </div>
  );
});
