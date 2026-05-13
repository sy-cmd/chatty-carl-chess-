import { memo, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { ChessMove } from '../../types';
import styles from './MoveHistory.module.css';

interface MovePair {
  moveNumber: number;
  white?: ChessMove;
  black?: ChessMove;
}

function pairMoves(history: ChessMove[]): MovePair[] {
  const pairs: MovePair[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }
  return pairs;
}

export const MoveHistory = memo(function MoveHistory() {
  const { history } = useGameStore();
  const listRef = useRef<HTMLOListElement>(null);
  const pairs = pairMoves(history);

  // Auto-scroll to the latest move
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history.length]);

  if (history.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.heading}>Moves</h3>
        <p className={styles.empty}>No moves yet</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Moves</h3>
      <ol className={styles.list} ref={listRef} aria-label="Move history">
        {pairs.map((pair) => (
          <li key={pair.moveNumber} className={styles.row}>
            <span className={styles.number}>{pair.moveNumber}.</span>
            <MoveCell move={pair.white} current={pair.black === undefined && history[history.length - 1] === pair.white} />
            <MoveCell move={pair.black} current={history[history.length - 1] === pair.black} />
          </li>
        ))}
      </ol>
    </div>
  );
});

interface MoveCellProps {
  move?: ChessMove;
  current: boolean;
}

const MoveCell = memo(function MoveCell({ move, current }: MoveCellProps) {
  if (!move) return <span className={styles.cell} />;
  return (
    <span className={`${styles.cell} ${current ? styles.current : ''}`} aria-current={current ? 'true' : undefined}>
      {move.san}
    </span>
  );
});
