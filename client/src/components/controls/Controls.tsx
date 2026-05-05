import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import { useGameActions } from '../../hooks/useGameActions';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DIFFICULTY_OPTIONS, BOARD_THEME_LABELS, PERSONALITY_LABELS } from '../../constants';
import type { BoardTheme, PersonalityId } from '../../types';
import styles from './Controls.module.css';

export const Controls = memo(function Controls() {
  const { difficulty, personality, gameMode, moveLoading, gameOver } = useGameStore();
  const { boardTheme, boardFlipped, voiceEnabled, ttsAvailable, setBoardTheme, setVoiceEnabled, toggleSettingsPanel, settingsPanelOpen } = useUiStore();
  const { handleUndo, handleReset, handleFlip, handleGetHint, handleSetDifficulty, handleSetPersonality, handleSetGameMode } = useGameActions();
  const [hintLoading, setHintLoading] = useState(false);

  const canUndo = !moveLoading && !gameOver;

  const onHintClick = useCallback(async () => {
    setHintLoading(true);
    await handleGetHint();
    setHintLoading(false);
  }, [handleGetHint]);

  return (
    <div className={styles.wrapper}>
      {/* ── Primary action buttons ─────────────────────────────────────── */}
      <div className={styles.primaryActions}>
        <Button variant="primary" size="sm" onClick={handleReset} disabled={moveLoading} aria-label="New game">
          ♟ New Game
        </Button>
        <Button variant="secondary" size="sm" onClick={handleFlip} aria-label={boardFlipped ? 'Flip board to white' : 'Flip board to black'}>
          ⇅ Flip
        </Button>
        <Button variant="secondary" size="sm" onClick={canUndo ? handleUndo : undefined} disabled={!canUndo} aria-label="Undo last move">
          ↩ Undo
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void onHintClick()}
          disabled={moveLoading || gameOver || hintLoading}
          loading={hintLoading}
          aria-label="Get move hint"
        >
          💡 Hint
        </Button>
        <Button
          variant={settingsPanelOpen ? 'primary' : 'ghost'}
          size="sm"
          onClick={toggleSettingsPanel}
          aria-expanded={settingsPanelOpen}
          aria-controls="settings-panel"
          aria-label="Toggle settings"
        >
          ⚙ Settings
        </Button>
      </div>

      {/* ── Mode toggle ────────────────────────────────────────────────── */}
      <div className={styles.modeToggle} role="group" aria-label="Game mode">
        <button
          className={`${styles.modeBtn} ${gameMode === 'ai' ? styles.modeBtnActive : ''}`}
          onClick={() => handleSetGameMode('ai')}
          aria-pressed={gameMode === 'ai'}
        >
          vs AI
        </button>
        <button
          className={`${styles.modeBtn} ${gameMode === 'pvp' ? styles.modeBtnActive : ''}`}
          onClick={() => handleSetGameMode('pvp')}
          aria-pressed={gameMode === 'pvp'}
        >
          PvP
        </button>
      </div>

      {/* ── Settings panel ─────────────────────────────────────────────── */}
      {settingsPanelOpen && (
        <SettingsPanel
          difficulty={difficulty}
          personality={personality}
          boardTheme={boardTheme}
          voiceEnabled={voiceEnabled}
          ttsAvailable={ttsAvailable}
          onDifficulty={handleSetDifficulty}
          onPersonality={handleSetPersonality}
          onTheme={(t) => setBoardTheme(t as BoardTheme)}
          onVoice={setVoiceEnabled}
        />
      )}
    </div>
  );
});

// ── Settings panel (extracted for clarity) ────────────────────────────────

interface SettingsPanelProps {
  difficulty: number;
  personality: PersonalityId;
  boardTheme: BoardTheme;
  voiceEnabled: boolean;
  ttsAvailable: boolean;
  onDifficulty: (level: number) => void;
  onPersonality: (id: PersonalityId) => void;
  onTheme: (theme: string) => void;
  onVoice: (enabled: boolean) => void;
}

const SettingsPanel = memo(function SettingsPanel({
  difficulty,
  personality,
  boardTheme,
  voiceEnabled,
  ttsAvailable,
  onDifficulty,
  onPersonality,
  onTheme,
  onVoice,
}: SettingsPanelProps) {
  const handleDifficultyChange = useCallback((v: string) => onDifficulty(Number(v)), [onDifficulty]);
  const handlePersonalityChange = useCallback((v: string) => onPersonality(v as PersonalityId), [onPersonality]);

  const personalityOptions = (Object.entries(PERSONALITY_LABELS) as [PersonalityId, string][]).map(([id, name]) => ({
    value: id,
    label: name,
  }));

  const themeOptions = (Object.entries(BOARD_THEME_LABELS) as [BoardTheme, string][]).map(([id, name]) => ({
    value: id,
    label: name,
  }));

  return (
    <div id="settings-panel" className={styles.settingsPanel} role="region" aria-label="Settings">
      <div className={styles.settingsGrid}>
        <Select
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={handleDifficultyChange}
        />
        <Select
          label="Personality"
          options={personalityOptions}
          value={personality}
          onChange={handlePersonalityChange}
        />
        <Select
          label="Board Theme"
          options={themeOptions}
          value={boardTheme}
          onChange={onTheme}
        />
        {ttsAvailable && (
          <label className={styles.toggle}>
            <span className={styles.toggleLabel}>🔊 Voice</span>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => onVoice(e.target.checked)}
              className={styles.toggleInput}
              aria-label="Enable voice commentary"
            />
            <span className={`${styles.toggleTrack} ${voiceEnabled ? styles.toggleTrackOn : ''}`} aria-hidden="true">
              <span className={styles.toggleThumb} />
            </span>
          </label>
        )}
      </div>
    </div>
  );
});
