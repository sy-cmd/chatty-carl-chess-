import axios, { AxiosError } from 'axios';
import type {
  GameState,
  MakeMoveRequest,
  MoveResponse,
  AIMoveResponse,
  HintResponse,
  EvalResponse,
  Personality,
  PersonalityId,
  Voice,
  GameRecord,
  Stats,
  PuzzleResponse,
  OpeningResponse,
  GameMode,
  PieceColor,
  GameAnalysis,
} from '../types';
import { API_BASE } from '../constants';

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

function extractError(err: unknown): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { error?: string })?.error ?? err.message;
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred';
}

// ── Game state ─────────────────────────────────────────────────────────────

export async function fetchGameState(): Promise<GameState> {
  const { data } = await client.get<GameState>('/state');
  return data;
}

export async function resetGame(): Promise<GameState> {
  const { data } = await client.post<{ success: boolean; state: GameState }>('/reset');
  return data.state;
}

// ── Moves ──────────────────────────────────────────────────────────────────

export async function makeMove(request: MakeMoveRequest): Promise<MoveResponse> {
  try {
    const { data } = await client.post<MoveResponse>('/move', request);
    return data;
  } catch (err) {
    return { success: false, state: {} as GameState, error: extractError(err) };
  }
}

export async function makePvpMove(request: MakeMoveRequest): Promise<MoveResponse> {
  try {
    const { data } = await client.post<MoveResponse>('/pvp-move', request);
    return data;
  } catch (err) {
    return { success: false, state: {} as GameState, error: extractError(err) };
  }
}

export async function requestAIMove(difficulty?: number): Promise<AIMoveResponse> {
  try {
    const { data } = await client.post<AIMoveResponse>('/ai-move', { difficulty });
    return data;
  } catch (err) {
    return { success: false, state: {} as GameState, error: extractError(err) };
  }
}

export async function undoMove(): Promise<{ success: boolean; state: GameState; error?: string }> {
  try {
    const { data } = await client.post<{ success: boolean; state: GameState }>('/undo');
    return data;
  } catch (err) {
    return { success: false, state: {} as GameState, error: extractError(err) };
  }
}

export async function getHint(): Promise<HintResponse> {
  try {
    const { data } = await client.post<HintResponse>('/hint');
    return data;
  } catch (err) {
    return { success: false, hint: { from: '', to: '' }, error: extractError(err) } as HintResponse & { error: string };
  }
}

// ── Position evaluation ────────────────────────────────────────────────────

export async function getEvaluation(): Promise<EvalResponse> {
  const { data } = await client.post<EvalResponse>('/evaluate');
  return data;
}

// ── Game settings ──────────────────────────────────────────────────────────

export async function setDifficulty(difficulty: number): Promise<{ success: boolean; difficulty: number }> {
  const { data } = await client.post<{ success: boolean; difficulty: number }>('/difficulty', { difficulty });
  return data;
}

export async function setPersonality(personality: PersonalityId): Promise<{ success: boolean; personality: PersonalityId; name: string }> {
  const { data } = await client.post<{ success: boolean; personality: PersonalityId; name: string }>('/personality', { personality });
  return data;
}

export async function fetchPersonalities(): Promise<Personality[]> {
  const { data } = await client.get<Personality[]>('/personalities');
  return Array.isArray(data) ? data : [];
}

export async function setGameMode(mode: GameMode, color?: PieceColor): Promise<{ success: boolean; mode: GameMode; playerColor: string }> {
  const { data } = await client.post<{ success: boolean; mode: GameMode; playerColor: string }>('/mode', { mode, color });
  return data;
}

export async function fetchGameMode(): Promise<{ mode: GameMode; playerColor: string }> {
  const { data } = await client.get<{ mode: GameMode; playerColor: string }>('/mode');
  return data;
}

// ── Resign / draw ──────────────────────────────────────────────────────────

export async function resign(playerColor: string): Promise<{ success: boolean; state: GameState; result: string }> {
  const { data } = await client.post<{ success: boolean; state: GameState; result: string }>('/resign', { playerColor });
  return data;
}

export async function offerDraw(action: 'offer' | 'accept' | 'decline' | 'ai-respond', playerColor?: string): Promise<{ success: boolean; state?: GameState; accepted?: boolean }> {
  const { data } = await client.post<{ success: boolean; state?: GameState; accepted?: boolean }>('/offer-draw', { action, playerColor });
  return data;
}

// ── Game history & stats ───────────────────────────────────────────────────

export async function fetchGames(limit = 20, offset = 0): Promise<GameRecord[]> {
  const { data } = await client.get<GameRecord[]>('/games', { params: { limit, offset } });
  return data;
}

export async function fetchGame(id: number): Promise<GameRecord & { positions: string[] }> {
  const { data } = await client.get<GameRecord & { positions: string[] }>(`/games/${id}`);
  return data;
}

export async function deleteGame(id: number): Promise<{ success: boolean }> {
  const { data } = await client.delete<{ success: boolean }>(`/games/${id}`);
  return data;
}

export async function fetchStats(): Promise<Stats> {
  const { data } = await client.get<Stats>('/stats');
  return data;
}

export async function analyzeGame(gameId?: number): Promise<GameAnalysis> {
  const { data } = await client.post<GameAnalysis>('/analyze', { gameId });
  return data;
}

// ── Voice / TTS ────────────────────────────────────────────────────────────

export async function fetchVoices(): Promise<{ voices: Voice[]; personalityVoices: Record<string, string> }> {
  const { data } = await client.get<{ voices: Voice[]; personalityVoices: Record<string, string> }>('/voices');
  return data;
}

export async function fetchTtsStatus(): Promise<{ configured: boolean; message: string }> {
  const { data } = await client.get<{ configured: boolean; message: string }>('/tts-status');
  return data;
}

export async function speak(text: string, voiceId?: string, personality?: PersonalityId): Promise<ArrayBuffer> {
  const response = await client.post('/speak', { text, voiceId, personality }, { responseType: 'arraybuffer' });
  return response.data as ArrayBuffer;
}

// ── Puzzles ────────────────────────────────────────────────────────────────

export async function fetchNextPuzzle(theme?: string): Promise<PuzzleResponse> {
  const { data } = await client.get<PuzzleResponse>('/puzzle/next', { params: theme ? { theme } : {} });
  return data;
}

export async function fetchPuzzleThemes(): Promise<{ success: boolean; themes: string[] }> {
  const { data } = await client.get<{ success: boolean; themes: string[] }>('/puzzle/themes');
  return data;
}

export async function fetchPuzzleStats(): Promise<{ success: boolean; stats: { total: number; correct: number; incorrect: number; accuracy: number; avgTime: number } }> {
  const { data } = await client.get('/puzzle/stats');
  return data;
}

// ── Opening explorer ───────────────────────────────────────────────────────

export async function fetchOpeningInfo(fen: string): Promise<OpeningResponse> {
  const { data } = await client.get<OpeningResponse>('/opening', { params: { fen } });
  return data;
}
