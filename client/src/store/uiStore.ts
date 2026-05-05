import { create } from 'zustand';
import type {
  BoardSquare,
  BoardTheme,
  PersonalityId,
  ActiveModal,
  PendingPromotion,
  HintSquares,
} from '../types';

// ── State shape ────────────────────────────────────────────────────────────

interface UiStore {
  // Board interaction
  selectedSquare: BoardSquare | null;
  legalTargets: BoardSquare[];
  lastMoveSquares: { from: BoardSquare; to: BoardSquare } | null;
  hintSquares: HintSquares | null;
  pendingPromotion: PendingPromotion | null;

  // Board display
  boardFlipped: boolean;
  boardTheme: BoardTheme;

  // Modals
  activeModal: ActiveModal;

  // Settings panel visibility
  settingsPanelOpen: boolean;

  // Voice settings
  voiceEnabled: boolean;
  selectedVoiceId: string;
  ttsAvailable: boolean;

  // Sidebar tabs (mobile)
  mobileSidebarTab: 'history' | 'commentary' | 'settings';

  // ── Actions ──────────────────────────────────────────────────────────────
  selectSquare: (square: BoardSquare | null, targets?: BoardSquare[]) => void;
  setLastMove: (from: BoardSquare, to: BoardSquare) => void;
  setHint: (hint: HintSquares | null) => void;
  setPendingPromotion: (promo: PendingPromotion | null) => void;
  flipBoard: () => void;
  setBoardTheme: (theme: BoardTheme) => void;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;
  toggleSettingsPanel: () => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setSelectedVoice: (voiceId: string) => void;
  setTtsAvailable: (available: boolean) => void;
  setMobileSidebarTab: (tab: 'history' | 'commentary' | 'settings') => void;
  setPersonalityVoice: (personality: PersonalityId, voices: Record<string, string>) => void;
}

// ── Store implementation ───────────────────────────────────────────────────

export const useUiStore = create<UiStore>((set) => ({
  selectedSquare: null,
  legalTargets: [],
  lastMoveSquares: null,
  hintSquares: null,
  pendingPromotion: null,
  boardFlipped: false,
  boardTheme: 'classic',
  activeModal: null,
  settingsPanelOpen: false,
  voiceEnabled: false,
  selectedVoiceId: 'nova',
  ttsAvailable: false,
  mobileSidebarTab: 'commentary',

  selectSquare: (square, targets = []) => set({ selectedSquare: square, legalTargets: targets }),

  setLastMove: (from, to) => set({ lastMoveSquares: { from, to } }),

  setHint: (hint) => set({ hintSquares: hint }),

  setPendingPromotion: (promo) => set({ pendingPromotion: promo }),

  flipBoard: () => set((s) => ({ boardFlipped: !s.boardFlipped })),

  setBoardTheme: (theme) => set({ boardTheme: theme }),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  toggleSettingsPanel: () => set((s) => ({ settingsPanelOpen: !s.settingsPanelOpen })),

  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

  setSelectedVoice: (voiceId) => set({ selectedVoiceId: voiceId }),

  setTtsAvailable: (available) => set({ ttsAvailable: available }),

  setMobileSidebarTab: (tab) => set({ mobileSidebarTab: tab }),

  setPersonalityVoice: (personality, voices) => {
    const voiceId = voices[personality];
    if (voiceId) set({ selectedVoiceId: voiceId });
  },
}));
