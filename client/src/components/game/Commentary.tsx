import { memo, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import { useAudio } from '../../hooks/useAudio';
import { PERSONALITY_LABELS } from '../../constants';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import styles from './Commentary.module.css';

const PERSONALITY_AVATARS: Record<string, string> = {
  sassy: '😏',
  grandma: '👵',
  commentator: '🎙️',
  sydney: '😤',
  confused: '😵',
};

export const Commentary = memo(function Commentary() {
  const { commentary, commentaryLoading, personality, lastMistake, lastBlunder } = useGameStore();
  const { voiceEnabled } = useUiStore();
  const { speakText } = useAudio();
  const prevCommentary = useRef<string | null>(null);

  // Speak new commentary when it changes
  useEffect(() => {
    if (commentary && commentary !== prevCommentary.current && voiceEnabled) {
      void speakText(commentary, personality);
      prevCommentary.current = commentary;
    } else if (commentary) {
      prevCommentary.current = commentary;
    }
  }, [commentary, voiceEnabled, speakText, personality]);

  const avatar = PERSONALITY_AVATARS[personality] ?? '🤖';
  const name = PERSONALITY_LABELS[personality] ?? personality;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">{avatar}</span>
        <span className={styles.name}>{name}</span>
        {(lastMistake || lastBlunder) && (
          <span
            className={`${styles.badge} ${lastBlunder ? styles.blunderBadge : styles.mistakeBadge}`}
            aria-label={lastBlunder ? 'Blunder detected' : 'Mistake detected'}
          >
            {lastBlunder ? '??' : '?'}
          </span>
        )}
      </div>

      <div className={styles.bubble} role="status" aria-live="polite" aria-label="AI commentary">
        {commentaryLoading ? (
          <div className={styles.loading}>
            <LoadingSpinner size="sm" label="Generating commentary…" />
            <span className={styles.loadingText}>Thinking…</span>
          </div>
        ) : commentary ? (
          <p className={styles.text}>{commentary}</p>
        ) : (
          <p className={styles.placeholder}>Make a move to hear from {name}…</p>
        )}
      </div>
    </div>
  );
});
