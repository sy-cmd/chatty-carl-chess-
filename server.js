require('dotenv').config();
const express = require('express');
const path = require('path');
const GameLogic = require('./src/gameLogic');
const StockfishPlayer = require('./src/stockfishPlayer');
const { initGroq, generateCommentary, generateMoveExplanation } = require('./src/llmPlayer');
const { getAllPersonalities, getPersonalityName } = require('./src/prompts');

const app = express();
const PORT = process.env.PORT || 5000;

let difficulty = 10;
const game = new GameLogic();
const stockfish = new StockfishPlayer(difficulty);

game.setStockfish(stockfish);

initGroq(process.env.GROQ_API_KEY);

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

    let stockfishMoveResult;
    try {
      const fen = stateAfterPlayerMove.fen;
      const bestMove = await stockfish.getBestMove(fen);
      
      if (bestMove) {
        const sfFrom = bestMove.slice(0, 2);
        const sfTo = bestMove.slice(2, 4);
        stockfishMoveResult = game.makeMove(sfFrom, sfTo);
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

    res.json({
      success: true,
      state: finalState,
      llmComment,
      moveExplanation,
      mistakeDetected,
      blunderDetected,
      gameOver: finalState.gameOver,
      result: finalState.result
    });

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
