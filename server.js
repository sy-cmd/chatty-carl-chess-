require('dotenv').config();
const express = require('express');
const path = require('path');
const GameLogic = require('./src/gameLogic');
const StockfishPlayer = require('./src/stockfishPlayer');
const { initGroq, generateCommentary, generateMoveExplanation } = require('./src/llmPlayer');
const { getAllPersonalities, getPersonalityName } = require('./src/prompts');
const Database = require('./src/database');
const { synthesizeSpeech, getAvailableVoices, getVoiceByPersonality, getVoicesByGender, getCacheStats, clearCache, PERSONALITY_VOICES, isConfigured, DEFAULT_MODEL, HD_MODEL } = require('./src/ttsService');

const app = express();
const PORT = process.env.PORT || 5000;

let difficulty = 10;
const game = new GameLogic();
const stockfish = new StockfishPlayer(difficulty);

let gameStartTime = null;
let currentGameMoves = [];

let gameMode = 'ai';
let playerColor = 'white';

game.setStockfish(stockfish);

initGroq(process.env.GROQ_API_KEY);

Database.initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
});

async function initStockfish() {
  try {
    await stockfish.init('/usr/games/stockfish');
    await stockfish.setDifficulty(difficulty);
    console.log('Stockfish initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize Stockfish:', error.message);
    console.warn('Will use random moves as fallback');
  }
}

initStockfish();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/state', (req, res) => {
  try {
    const state = game.getState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/move', async (req, res) => {
  try {
    const { from, to, promotion, difficulty: diff, explain } = req.body;
    
    if (diff) {
      difficulty = diff;
      await stockfish.setDifficulty(diff);
    }
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from or to square' });
    }

    const playerMoveResult = game.makeMove(from, to, promotion || 'q');
    
    if (!playerMoveResult.success) {
      return res.json({ 
        success: false, 
        error: playerMoveResult.error,
        state: game.getState()
      });
    }

    if (!gameStartTime) {
      gameStartTime = Date.now();
    }
    currentGameMoves.push({ from, to, color: 'white', timestamp: Date.now() });

    const stateAfterPlayerMove = game.getState();
    const playerMoveNotation = `${from}-${to}`;
    
    let moveExplanation = null;
    if (explain) {
      try {
        moveExplanation = await generateMoveExplanation(stateAfterPlayerMove, playerMoveNotation);
      } catch (e) {
        console.error('Explanation error:', e.message);
      }
    }
    
    const evaluationBefore = await getMoveEvaluation(stateAfterPlayerMove.fen);
    
    if (stateAfterPlayerMove.gameOver) {
      const llmComment = await generateCommentary(
        stateAfterPlayerMove,
        playerMoveNotation,
        game.getPersonality(),
        true,
        stateAfterPlayerMove.result
      );
      
      return res.json({
        success: true,
        state: stateAfterPlayerMove,
        llmComment,
        moveExplanation,
        gameOver: true,
        result: stateAfterPlayerMove.result
      });
    }

    function saveGameToDatabase(finalState) {
      if (!gameStartTime || currentGameMoves.length === 0) return;
      
      const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
      
      let resultStr = 'draw';
      if (finalState.result) {
        if (finalState.result.includes('White wins')) resultStr = 'win';
        else if (finalState.result.includes('Black wins')) resultStr = 'loss';
      }
      
      const pgn = currentGameMoves.map((m, i) => {
        const moveNum = Math.floor(i / 2) + 1;
        return i % 2 === 0 ? `${moveNum}. ${m.from}-${m.to}` : `${m.from}-${m.to}`;
      }).join(' ');
      
      try {
        Database.saveGame({
          playerColor: 'white',
          opponent: game.getPersonality(),
          difficulty: difficulty,
          result: resultStr,
          pgn: pgn,
          analysis: null,
          durationSeconds: durationSeconds
        });
        console.log('Game saved to database');
      } catch (err) {
        console.error('Failed to save game:', err);
      }
    }

    let stockfishMoveResult;
    let stockfishMove = null;
    try {
      const fen = stateAfterPlayerMove.fen;
      const bestMove = await stockfish.getBestMove(fen);
      
      if (bestMove) {
        const sfFrom = bestMove.slice(0, 2);
        const sfTo = bestMove.slice(2, 4);
        stockfishMoveResult = game.makeMove(sfFrom, sfTo);
        if (stockfishMoveResult.success) {
          stockfishMove = { from: sfFrom, to: sfTo, color: 'black', timestamp: Date.now() };
          currentGameMoves.push(stockfishMove);
        }
      }
    } catch (sfError) {
      console.error('Stockfish error:', sfError.message);
    }

    if (!stockfishMoveResult || !stockfishMoveResult.success) {
      stockfishMoveResult = game.makeRandomMove();
      
      if (!stockfishMoveResult.success) {
        return res.json({
          success: true,
          state: game.getState(),
          llmComment: "I'm confused! Your turn again!",
          moveExplanation,
          gameOver: true,
          result: 'White wins!'
        });
      }
    }

    const finalState = game.getState();
    const stockfishMoveNotation = stockfishMoveResult.move ? 
      `${stockfishMoveResult.move.from}-${stockfishMoveResult.move.to}` : 'my move';

    let llmComment = await generateCommentary(
      finalState,
      playerMoveNotation + ' ' + stockfishMoveNotation,
      game.getPersonality(),
      finalState.gameOver,
      finalState.result
    );
    
    let mistakeDetected = false;
    let blunderDetected = false;
    
    if (evaluationBefore) {
      const evaluationAfter = await getMoveEvaluation(finalState.fen);
      if (evaluationAfter !== null && evaluationBefore !== null) {
        const diff = evaluationBefore - evaluationAfter;
        if (Math.abs(diff) > 2) mistakeDetected = true;
        if (Math.abs(diff) > 4) blunderDetected = true;
      }
    }

    const response = {
      success: true,
      state: finalState,
      llmComment,
      moveExplanation,
      mistakeDetected,
      blunderDetected,
      gameOver: finalState.gameOver,
      result: finalState.result
    };

    if (finalState.gameOver) {
      saveGameToDatabase(finalState);
    }

    res.json(response);

  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

async function getMoveEvaluation(fen) {
  try {
    const evaluation = await stockfish.getEvaluation(fen);
    return evaluation;
  } catch (e) {
    return null;
  }
}

app.post('/api/undo', (req, res) => {
  try {
    const result = game.undoLastTwoMoves();
    if (result.success) {
      res.json({ success: true, state: result.state });
    } else {
      res.json({ success: false, error: 'Nothing to undo' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hint', async (req, res) => {
  try {
    const fen = game.getState().fen;
    const bestMove = await stockfish.getBestMove(fen);
    
    if (bestMove) {
      res.json({ 
        success: true, 
        hint: { 
          from: bestMove.slice(0, 2), 
          to: bestMove.slice(2, 4) 
        } 
      });
    } else {
      res.json({ success: false, error: 'No hint available' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/difficulty', async (req, res) => {
  try {
    const { difficulty: diff } = req.body;
    difficulty = diff || 10;
    await stockfish.setDifficulty(difficulty);
    res.json({ success: true, difficulty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const fen = game.getState().fen;
    const evaluation = await stockfish.getEvaluation(fen);
    res.json({ score: evaluation });
  } catch (error) {
    res.status(500).json({ error: error.message, score: 0 });
  }
});

app.post('/api/reset', (req, res) => {
  try {
    gameStartTime = Date.now();
    currentGameMoves = [];
    const state = game.reset();
    res.json({ success: true, state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personality', (req, res) => {
  try {
    const { personality } = req.body;
    game.setPersonality(personality);
    res.json({ 
      success: true, 
      personality: personality,
      name: getPersonalityName(personality)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/personalities', (req, res) => {
  res.json(getAllPersonalities());
});

app.get('/api/games', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const games = Database.getGames(limit, offset);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/games/:id', (req, res) => {
  try {
    const game = Database.getGame(req.params.id);
    if (game) {
      res.json(game);
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/games/:id', (req, res) => {
  try {
    Database.deleteGame(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = Database.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { gameId } = req.body;
    
    let gameData;
    if (gameId) {
      gameData = Database.getGame(gameId);
    }
    
    if (!gameData || !gameData.pgn) {
      return res.status(400).json({ error: 'No game found to analyze' });
    }
    
    const moves = gameData.pgn.split(' ').filter(m => m.match(/^[a-h][1-8]-[a-h][1-8]$/));
    const analysis = await analyzeGame(moves, gameData.difficulty || 10);
    
    if (gameId) {
      const { Chess } = require('chess.js');
      const chess = new Chess();
      
      for (const move of moves) {
        const [from, to] = move.split('-');
        chess.move({ from, to, promotion: 'q' });
      }
      
      const finalFen = chess.fen();
      const finalEval = await stockfish.getEvaluation(finalFen);
      analysis.finalEvaluation = finalEval;
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function analyzeGame(moves, difficulty) {
  const { Chess } = require('chess.js');
  const chess = new Chess();
  
  const analysis = {
    moves: [],
    mistakes: [],
    blunders: [],
    totalMoves: moves.length,
    accuracy: 0,
    evaluationHistory: []
  };
  
  let previousEval = 0;
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const [from, to] = move.split('-');
    
    const moveResult = chess.move({ from, to, promotion: 'q' });
    if (!moveResult) continue;
    
    const fen = chess.fen();
    const evalScore = await stockfish.getEvaluation(fen);
    
    const evalDelta = i > 0 ? Math.abs(evalScore - previousEval) : 0;
    
    let classification = 'good';
    let alternative = null;
    
    if (evalDelta > 4) {
      classification = 'blunder';
      analysis.blunders.push({
        moveNumber: Math.floor(i / 2) + 1,
        color: i % 2 === 0 ? 'white' : 'black',
        move: move,
        evaluationDrop: evalDelta
      });
      
      try {
        const bestMove = await stockfish.getBestMove(fen);
        if (bestMove) {
          alternative = {
            from: bestMove.slice(0, 2),
            to: bestMove.slice(2, 4)
          };
        }
      } catch (e) {}
    } else if (evalDelta > 2) {
      classification = 'mistake';
      analysis.mistakes.push({
        moveNumber: Math.floor(i / 2) + 1,
        color: i % 2 === 0 ? 'white' : 'black',
        move: move,
        evaluationDrop: evalDelta
      });
    }
    
    analysis.moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      color: i % 2 === 0 ? 'white' : 'black',
      move: move,
      evaluation: evalScore,
      classification: classification,
      alternative: alternative,
      inCheck: chess.inCheck()
    });
    
    analysis.evaluationHistory.push({
      move: i + 1,
      evaluation: evalScore
    });
    
    previousEval = evalScore;
  }
  
  const totalErrors = analysis.mistakes.length + analysis.blunders.length;
  analysis.accuracy = Math.max(0, 100 - (totalErrors / moves.length) * 100);
  
  const openingNames = {
    'e2e4': 'King\'s Pawn Opening',
    'e2e4 e7e5': 'Open Game',
    'e2e4 c7c5': 'Sicilian Defense',
    'e2e4 e7e5 g1f3 b8c6': 'Ruy Lopez',
    'd2d4 d7d5 c2c4': 'Queen\'s Gambit',
    'd2d4 g8f6 c2c4 e7e6 g1f3': 'King\'s Indian Defense',
    'e2e4 e7e6 d2d4 d7d5': 'French Defense',
    'e2e4 e7e5 f1c4': 'Italian Game',
    'd2d4 d7d5 g1f3': 'Closed Game',
    'g1f3 d7d5 d2d4 g8f6 c2c4': 'Slav Defense'
  };
  
  const gameMoves = moves.slice(0, 5).join(' ');
  analysis.opening = openingNames[gameMoves] || 'Unknown Opening';
  
  return analysis;
}

app.post('/api/mode', (req, res) => {
  try {
    const { mode, color } = req.body;
    gameMode = mode || 'ai';
    
    if (color) {
      playerColor = color;
    }
    
    if (gameMode === 'pvp') {
      game.reset();
      currentGameMoves = [];
      gameStartTime = null;
    }
    
    res.json({ 
      success: true, 
      mode: gameMode,
      playerColor: playerColor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mode', (req, res) => {
  res.json({ mode: gameMode, playerColor: playerColor });
});

app.post('/api/speak', async (req, res) => {
  try {
    const { text, voiceId, personality, model } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }
    
    let selectedVoiceId = voiceId;
    
    if (!selectedVoiceId && personality) {
      const voice = getVoiceByPersonality(personality);
      selectedVoiceId = voice.id;
    }
    
    selectedVoiceId = selectedVoiceId || 'alloy';
    
    const selectedModel = model === 'hd' ? HD_MODEL : DEFAULT_MODEL;
    
    const audioBuffer = await synthesizeSpeech(text, selectedVoiceId, selectedModel);
    
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Disposition', 'inline');
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/voices', (req, res) => {
  try {
    const gender = req.query.gender;
    const voices = gender ? getVoicesByGender(gender) : getAvailableVoices();
    res.json({ 
      voices,
      personalityVoices: PERSONALITY_VOICES
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tts-status', (req, res) => {
  res.json({ 
    configured: isConfigured(),
    message: isConfigured() 
      ? 'OpenAI TTS is ready' 
      : 'TTS not configured - will use browser fallback'
  });
});

app.get('/api/tts-cache', (req, res) => {
  res.json(getCacheStats());
});

app.post('/api/tts-cache/clear', (req, res) => {
  clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

app.post('/api/pvp-move', async (req, res) => {
  try {
    const { from, to, promotion } = req.body;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from or to square' });
    }

    const playerMoveResult = game.makeMove(from, to, promotion || 'q');
    
    if (!playerMoveResult.success) {
      return res.json({ 
        success: false, 
        error: playerMoveResult.error,
        state: game.getState()
      });
    }

    if (!gameStartTime) {
      gameStartTime = Date.now();
    }
    currentGameMoves.push({ from, to, color: game.getState().turn, timestamp: Date.now() });

    const stateAfterPlayerMove = game.getState();
    
    if (stateAfterPlayerMove.gameOver) {
      savePvpGame(stateAfterPlayerMove);
      
      return res.json({
        success: true,
        state: stateAfterPlayerMove,
        gameOver: true,
        result: stateAfterPlayerMove.result
      });
    }

    res.json({
      success: true,
      state: stateAfterPlayerMove,
      gameOver: false
    });

  } catch (error) {
    console.error('PvP move error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

function savePvpGame(finalState) {
  if (!gameStartTime || currentGameMoves.length === 0) return;
  
  const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
  
  let resultStr = 'draw';
  if (finalState.result) {
    if (finalState.result.includes('White wins')) resultStr = 'white_win';
    else if (finalState.result.includes('Black wins')) resultStr = 'black_win';
  }
  
  const pgn = currentGameMoves.map((m, i) => {
    const moveNum = Math.floor(i / 2) + 1;
    return i % 2 === 0 ? `${moveNum}. ${m.from}-${m.to}` : `${m.from}-${m.to}`;
  }).join(' ');
  
  try {
    Database.saveGame({
      playerColor: playerColor,
      opponent: 'Local PvP',
      difficulty: 0,
      result: resultStr,
      pgn: pgn,
      analysis: null,
      durationSeconds: durationSeconds
    });
    console.log('PvP game saved to database');
  } catch (err) {
    console.error('Failed to save PvP game:', err);
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Chess server running on http://localhost:${PORT}`);
  console.log(`Stockfish: Enabled (Skill Level ${difficulty})`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY not set. LLM commentary will not work!');
  }
});
