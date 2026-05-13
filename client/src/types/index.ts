// ── Core chess primitives ──────────────────────────────────────────────────

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
export type BoardSquare = string; // e.g. "e4"
export type BoardTheme = 'classic' | 'blue' | 'wood' | 'purple' | 'dark';
export type PersonalityId = 'sassy' | 'grandma' | 'commentator' | 'sydney' | 'confused';
export type GameMode = 'ai' | 'pvp';
export type GameResult = 'win' | 'loss' | 'draw';
export type MoveFlag =
  | 'n' // normal
  | 'b' // big pawn
  | 'e' // en passant
  | 'c' // capture
  | 'f' // promotion capture
  | 'p'; // promotion

// ── Game data structures ───────────────────────────────────────────────────

export interface ChessMove {
  color: PieceColor;
  from: BoardSquare;
  to: BoardSquare;
  piece: PieceType;
  san: string;
  promotion?: PromotionPiece;
  flags: string;
  captured?: PieceType;
}

export interface GameState {
  fen: string;
  turn: PieceColor;
  gameOver: boolean;
  inCheck: boolean;
  result: string | null;
  history: ChessMove[];
  legalMoves: ChessMove[];
}

export interface Personality {
  id: PersonalityId;
  name: string;
}

export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
}

// ── Database / history records ─────────────────────────────────────────────

export interface GameRecord {
  id: number;
  created_at: string;
  player_color: 'white' | 'black';
  opponent: string;
  difficulty: number;
  result: GameResult;
  pgn: string;
  analysis: GameAnalysis | null;
  duration_seconds: number;
}

export interface MistakeRecord {
  moveNumber: number;
  move: string;
  evalDrop: number;
  alternative?: string;
}

export interface AnalyzedMove {
  move: string;
  classification: 'good' | 'mistake' | 'blunder';
  evaluation: number;
}

export interface GameAnalysis {
  moves: AnalyzedMove[];
  mistakes: MistakeRecord[];
  blunders: MistakeRecord[];
  accuracy: number;
  evaluationHistory: number[];
  opening: string;
}

export interface Stats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  avgDuration: number;
}

// ── Puzzle data ────────────────────────────────────────────────────────────

export interface Puzzle {
  id: string;
  fen: string;
  rating: number;
  themes: string[];
  solution: string[];
  initialPly: number;
}

// ── Opening data ───────────────────────────────────────────────────────────

export interface OpeningMove {
  move: string;
  white: number;
  draws: number;
  black: number;
  total: number;
  whitePercent: string;
  drawPercent: string;
  blackPercent: string;
}

export interface OpeningInfo {
  name: string;
  eco: string;
  totalGames?: number;
  moves?: OpeningMove[];
  source: 'lichess' | 'local';
}

// ── API request / response shapes ─────────────────────────────────────────

export interface MakeMoveRequest {
  from: BoardSquare;
  to: BoardSquare;
  promotion?: PromotionPiece;
  difficulty?: number;
  explain?: boolean;
}

export interface MoveResponse {
  success: boolean;
  state: GameState;
  llmComment?: string;
  moveExplanation?: string;
  mistakeDetected?: boolean;
  blunderDetected?: boolean;
  gameOver?: boolean;
  result?: string;
  error?: string;
}

export interface AIMoveResponse {
  success: boolean;
  state: GameState;
  llmComment?: string;
  mistakeDetected?: boolean;
  blunderDetected?: boolean;
  gameOver?: boolean;
  result?: string;
  error?: string;
}

export interface HintResponse {
  success: boolean;
  hint: { from: BoardSquare; to: BoardSquare };
}

export interface EvalResponse {
  score: number;
}

export interface PuzzleResponse {
  success: boolean;
  puzzle: Puzzle;
}

export interface OpeningResponse {
  success: boolean;
  opening: {
    fen: string;
    opening: { name: string; eco: string };
    totalGames?: number;
    moves?: OpeningMove[];
    source: 'lichess' | 'local';
  };
}

export interface PersonalitiesResponse {
  personalities?: Personality[];
}

export interface VoicesResponse {
  voices: Voice[];
  personalityVoices: Record<PersonalityId, string>;
}

// ── UI-only types ──────────────────────────────────────────────────────────

export interface PendingPromotion {
  from: BoardSquare;
  to: BoardSquare;
}

export interface HintSquares {
  from: BoardSquare;
  to: BoardSquare;
}

export type ActiveModal = 'gameOver' | 'promotion' | 'puzzle' | 'history' | null;
