const Groq = require('groq-sdk');
const { getSystemPrompt } = require('./prompts');

const MODEL = 'llama-3.1-8b-instant';

let client = null;

function initGroq(apiKey) {
  if (!client && apiKey) {
    client = new Groq({ apiKey });
  }
  return client;
}

function getClient() {
  return client;
}

async function makeMoveWithComment(gameState, playerMove, currentPersonality) {
  if (!client) {
    throw new Error('Groq client not initialized. Set GROQ_API_KEY environment variable.');
  }

  const systemPrompt = getSystemPrompt(currentPersonality);
  
  const fen = gameState.fen;
  const turn = gameState.turn === 'w' ? "White (you)" : "Black (me)";
  const lastMove = playerMove || "the start of the game";
  
  const legalMoves = gameState.legalMoves || [];
  const moveList = legalMoves.slice(0, 10).join(', ');
  
  const userMessage = `Current board state (FEN): ${fen}
It's now ${turn}'s turn.
The last move was: ${lastMove}

Available legal moves for black (pick from these): ${moveList}

Respond with a funny commentary on this position (1-2 sentences), then make your move.
Your move must be in this exact format at the end of your response:
MOVE: <from_square><to_square>
For example: MOVE: e7e5 or MOVE: g1f3

IMPORTANT: You MUST pick a valid move from the available moves listed above!`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: MODEL,
      temperature: 0.9,
      max_tokens: 300,
      top_p: 0.9,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';
    
    const moveMatch = response.match(/MOVE:\s*([a-h][1-8][a-h][1-8])/i);
    let llmMove = null;
    let comment = response;

    if (moveMatch) {
      llmMove = moveMatch[1];
      comment = response.replace(/MOVE:.*/i, '').trim();
    }

    return {
      response: comment,
      move: llmMove
    };
  } catch (error) {
    console.error('Groq API error:', error.message);
    throw new Error('Failed to get LLM response: ' + error.message);
  }
}

async function generateCommentary(gameState, lastMove, currentPersonality, isGameOver = false, result = null) {
  if (!client) {
    throw new Error('Groq client not initialized. Set GROQ_API_KEY environment variable.');
  }

  const systemPrompt = getSystemPrompt(currentPersonality);
  const fen = gameState.fen;
  const turn = gameState.turn === 'w' ? "White (you)" : "Black (me)";
  
  let userMessage;
  
  if (isGameOver && result) {
    if (result.includes('White wins')) {
      userMessage = `The game is over! You won by checkmate! Give a funny, good-natured response about losing (1-2 sentences). You can be a sore loser or a gracious one - just be funny!`;
    } else if (result.includes('Black wins')) {
      userMessage = `The game is over! You lost to me! Give a funny, cocky victory message (1-2 sentences). Brag about your chess skills!`;
    } else {
      userMessage = `The game is over! It's a draw! Give a funny response about the draw (1-2 sentences).`;
    }
  } else {
    userMessage = `Current board state (FEN): ${fen}
It's now ${turn}'s turn.
The last move was: ${lastMove}

Give a short, funny commentary on this position (1-2 sentences max).
Never use markdown or formatting.`;
  }

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: MODEL,
      temperature: 0.9,
      max_tokens: 150,
    });

    return chatCompletion.choices[0]?.message?.content || 'Nice move!';
  } catch (error) {
    console.error('Groq API error:', error.message);
    return 'Nice move! Let me think...';
  }
}

async function generateMoveExplanation(gameState, lastMove) {
  if (!client) {
    return null;
  }

  const fen = gameState.fen;
  
  const userMessage = `You are a chess instructor. Explain why the move "${lastMove}" was made in this position.
Current board (FEN): ${fen}

Give a brief, educational explanation (1-2 sentences) about why this move is good or what it's trying to accomplish.
Be encouraging and friendly.`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a friendly chess instructor who explains moves in simple terms.' },
        { role: 'user', content: userMessage }
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 100,
    });

    return chatCompletion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Groq explanation error:', error.message);
    return null;
  }
}

module.exports = {
  initGroq,
  getClient,
  makeMoveWithComment,
  generateCommentary,
  generateMoveExplanation,
  MODEL
};
