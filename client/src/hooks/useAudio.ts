import { useCallback, useRef } from 'react';
import { useUiStore } from '../store/uiStore';
import * as api from '../services/api';
import type { PersonalityId } from '../types';

type SoundType = 'move' | 'capture' | 'check' | 'gameOver' | 'undo';

const SOUND_CONFIG: Record<SoundType, { freq: number; duration: number; type: OscillatorType }> = {
  move: { freq: 440, duration: 80, type: 'sine' },
  capture: { freq: 220, duration: 120, type: 'sawtooth' },
  check: { freq: 880, duration: 200, type: 'square' },
  gameOver: { freq: 150, duration: 600, type: 'triangle' },
  undo: { freq: 330, duration: 100, type: 'sine' },
};

export function useAudio() {
  const { voiceEnabled, selectedVoiceId } = useUiStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  function getAudioContext(): AudioContext {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getAudioContext();
      const { freq, duration, type: waveType } = SOUND_CONFIG[type];

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Web Audio not available — silently ignore
    }
  }, []);

  const speakText = useCallback(async (text: string, personality?: PersonalityId) => {
    if (!voiceEnabled || !text.trim()) return;

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    try {
      const buffer = await api.speak(text, selectedVoiceId, personality);
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
      });

      await audio.play();
    } catch {
      // TTS failed — non-critical, silently skip
    }
  }, [voiceEnabled, selectedVoiceId]);

  const stopSpeech = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, []);

  return { playSound, speakText, stopSpeech };
}
