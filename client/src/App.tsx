import { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { useUiStore } from './store/uiStore';
import { useTimer } from './hooks/useTimer';
import { useAudio } from './hooks/useAudio';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ChessBoard } from './components/board/ChessBoard';
import { EvaluationBar } from './components/board/EvaluationBar';
import { GameInfo, Clock } from './components/game/GameInfo';
import { MoveHistory } from './components/game/MoveHistory';
import { CapturedPieces } from './components/game/CapturedPieces';
import { Commentary } from './components/game/Commentary';
import { Controls } from './components/controls/Controls';
import { PromotionModal } from './components/modals/PromotionModal';
import { GameOverModal } from './components/modals/GameOverModal';
import * as api from './services/api';
import styles from './App.module.css';

const DEFAULT_TIME = 600; // 10 minutes

function AppContent() {
  const { loadState, gameOver, turn, error, clearError, moveLoading, history, inCheck } = useGameStore();
  const { setTtsAvailable, mobileSidebarTab, setMobileSidebarTab } = useUiStore();
  const { playSound } = useAudio();
  const timer = useTimer(DEFAULT_TIME);
  const prevHistoryLenRef = useRef(0);

  // ── Initialise on mount ──────────────────────────────────────────────────
  useEffect(() => {
    void loadState();
  }, [loadState]);

  // ── Check TTS availability ───────────────────────────────────────────────
  useEffect(() => {
    api.fetchTtsStatus()
      .then(({ configured }) => setTtsAvailable(configured))
      .catch(() => setTtsAvailable(false));
  }, [setTtsAvailable]);

  // ── Timer: switch active side on turn change ─────────────────────────────
  useEffect(() => {
    if (!gameOver && timer.whiteTime > 0 && timer.blackTime > 0) {
      timer.switchTurn(turn);
      if (!timer.isRunning) {
        timer.start(turn);
      }
    }
    if (gameOver) {
      timer.stop();
    }
  }, [turn, gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sound on move ────────────────────────────────────────────────────────
  useEffect(() => {
    const currentLen = history.length;
    if (currentLen > prevHistoryLenRef.current) {
      const lastMove = history[currentLen - 1];
      if (gameOver) {
        playSound('gameOver');
      } else if (inCheck) {
        playSound('check');
      } else if (lastMove?.captured) {
        playSound('capture');
      } else {
        playSound('move');
      }
    }
    prevHistoryLenRef.current = currentLen;
  }, [history, gameOver, inCheck, playSound]);

  if (error) {
    return (
      <div className={styles.errorScreen} role="alert">
        <div className={styles.errorBox}>
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={() => { clearError(); void loadState(); }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon} aria-hidden="true">♟</span>
          <h1 className={styles.logoTitle}>Chatty Carl Chess</h1>
        </div>
        {moveLoading && (
          <div className={styles.headerSpinner} aria-label="Move processing">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </header>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <main className={styles.main}>
        {/* Left panel */}
        <aside className={styles.leftPanel} aria-label="Game information">
          <Clock
            seconds={timer.blackTime}
            active={!gameOver && turn === 'b'}
            color="b"
            label="Black"
          />
          <CapturedPieces />
          <GameInfo />
          <Clock
            seconds={timer.whiteTime}
            active={!gameOver && turn === 'w'}
            color="w"
            label="White"
          />
        </aside>

        {/* Board section */}
        <section className={styles.boardSection}>
          <div className={styles.boardRow}>
            <EvaluationBar />
            <ChessBoard />
          </div>
          <Controls />
        </section>

        {/* Right panel */}
        <aside className={styles.rightPanel} aria-label="Commentary and moves">
          {/* Mobile tab switcher */}
          <div className={styles.mobileTabs} role="tablist">
            {(['commentary', 'history', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={mobileSidebarTab === tab}
                className={`${styles.mobileTab} ${mobileSidebarTab === tab ? styles.mobileTabActive : ''}`}
                onClick={() => setMobileSidebarTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.sidebarContent}>
            <Commentary />
            <MoveHistory />
          </div>
        </aside>
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <PromotionModal />
      <GameOverModal />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
