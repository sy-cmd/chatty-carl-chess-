# Chatty Carl Chess - Technical Documentation

## Overview

Chatty Carl Chess is a fully-featured chess web application with an AI opponent that provides funny, personality-driven commentary during gameplay. The application combines traditional chess engine analysis (Stockfish) with large language model commentary (Groq LLM) to create an engaging and entertaining chess experience.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Frontend)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   HTML/UI   │  │  JavaScript │  │  Tailwind   │  │  Web Speech │     │
│  │             │◄─┤   Logic     │◄─┤    CSS      │  │    API      │     │
│  └─────────────┘  └──────┬──────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │ HTTP/Fetch
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      NODE.JS SERVER (Backend)                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     EXPRESS SERVER (port 5000)                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │    │
│  │  │   REST   │  │   Game   │  │Timer/    │  │   Static     │     │    │
│  │  │   API    │──┤  Logic   │  │State     │  │   Files      │     │    │
│  │  └──────────┘  └────┬─────┘  └──────────┘  └──────────────┘     │    │
│  └─────────────────────┼───────────────────────────────────────────┘    │
│                        │                                                │
│         ┌──────────────┼──────────────┐                                 │
│         ▼              ▼              ▼                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                           │
│  │ Stockfish  │ │   Groq     │ │  chess.js  │                           │
│  │   Engine   │ │    LLM     │ │   Library  │                           │
│  │ (node-uci) │ │    API     │ │            │                           │
│  └────────────┘ └────────────┘ └────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Frontend-Backend Communication

The frontend and backend communicate entirely through REST API calls using JavaScript's `fetch()` function:

1. **Page Load**: Frontend fetches `/api/state` to get initial board position
2. **User Move**: Frontend sends move to `/api/move`, receives AI response + commentary
3. **Analysis**: Frontend polls `/api/evaluate` for position evaluation
4. **All updates**: Use JSON format for request/response data

## Tech Stack

### Backend Dependencies (package.json)

```json
{
  "express": "^4.18.2",        // Web server framework
  "chess.js": "^1.4.0",        // Chess rules and move validation
  "node-uci": "^1.3.4",       // Stockfish UCI protocol wrapper
  "groq-sdk": "^0.37.0",       // Groq LLM API client
  "dotenv": "^16.3.1"          // Environment variable management
}
```

### Frontend Dependencies

- **Tailwind CSS** (via CDN) - Styling
- **Web Speech API** - Voice commentary (browser native)
- **Web Audio API** - Sound effects (browser native)
- **SVG Chess Pieces** - From cm-chessboard package

### External Services

- **Stockfish** - Chess engine (installed at `/usr/games/stockfish`)
- **Groq API** - LLM for commentary (free tier: llama-3.1-8b-instant)

## API Endpoints

### 1. GET /api/state

Returns the current game state including board position, turn, legal moves, and history.

**Response:**
```json
{
  "fen": "r1bqkb1r/pp2pp1p/2n2p2/3p4/3pP3/2N2P2/PPP3PP/R2QKBNR w KQkq - 0 7",
  "turn": "w",
  "gameOver": false,
  "inCheck": false,
  "result": null,
  "history": [
    { "color": "w", "from": "d2", "to": "d4", "piece": "p", "san": "d4", ... }
  ],
  "legalMoves": [
    { "color": "w", "from": "e4", "to": "e5", "piece": "p", "san": "e5", ... }
  ]
}
```

### 2. POST /api/move

Makes a user move and returns the AI response with commentary. This is the main endpoint that handles both the user's move and the AI's reply in a single call.

**Request:**
```json
{
  "from": "e2",
  "to": "e4",
  "promotion": "q",
  "difficulty": 10,
  "explain": true
}
```

**Response:**
```json
{
  "success": true,
  "state": { /* updated game state */ },
  "llmComment": "Nice try, but my knight is about to ruin your day! MOVE: g8f6",
  "moveExplanation": "The AI moved knight from g8 to f6, controlling the center...",
  "mistakeDetected": false,
  "blunderDetected": false,
  "gameOver": false
}
```

### 3. POST /api/evaluate

Returns Stockfish's position evaluation (positive = white better, negative = black better).

**Response:**
```json
{
  "score": 0.45
}
```

The score is in pawn units (1.0 = 1 pawn advantage).

### 4. POST /api/undo

Undoes the last two moves (user's move + AI's move).

**Response:**
```json
{
  "success": true,
  "state": { /* game state after undo */ }
}
```

### 5. POST /api/hint

Gets a hint for the best move from Stockfish.

**Response:**
```json
{
  "success": true,
  "hint": {
    "from": "e2",
    "to": "e4"
  }
}
```

### 6. POST /api/reset

Starts a new game.

**Response:**
```json
{
  "success": true,
  "state": { /* initial game state */ }
}
```

### 7. POST /api/personality

Changes the AI opponent's personality.

**Request:**
```json
{
  "personality": "sassy"
}
```

**Response:**
```json
{
  "success": true,
  "personality": "sassy",
  "name": "Sassy Sarah"
}
```

### 8. GET /api/personalities

Lists all available AI personalities.

**Response:**
```json
[
  { "id": "sassy", "name": "Sassy Sarah" },
  { "id": "grandma", "name": "Grandma Gladys" },
  { "id": "commentator", "name": "Commentator Carl" },
  { "id": "trashTalker", "name": "Trash Talker Tony" },
  { "id": "confused", "name": "Confused Carl" }
]
```

## Code Components

### server.js

The main Express server that handles all API routes and orchestrates the game.

**Key responsibilities:**
- Initialize Express server on port 5000
- Set up static file serving for `/public` directory
- Initialize Stockfish engine on startup
- Handle all REST API endpoints
- Coordinate between game logic, Stockfish, and Groq LLM

**Startup process:**
```javascript
1. Load environment variables (.env)
2. Create GameLogic instance
3. Create StockfishPlayer instance
4. Initialize Stockfish engine at /usr/games/stockfish
5. Initialize Groq client with API key
6. Start Express server
```

### gameLogic.js

A wrapper around the chess.js library that provides a cleaner API for the server.

**Key methods:**
- `getState()` - Returns full game state (FEN, turn, history, legal moves)
- `makeMove(from, to, promotion)` - Validates and executes a move
- `undoLastTwoMoves()` - Undoes user + AI move pair
- `setPersonality(personality)` - Changes AI personality
- `getRandomMove()` - Fallback random move generator

**State object returned by getState():**
```javascript
{
  fen: string,           // Forsyth-Edwards notation (board position)
  turn: 'w' | 'b',       // Whose turn
  gameOver: boolean,      // Is game over
  inCheck: boolean,      // Is current player in check
  result: string | null, // '1-0', '0-1', '1/2-1/2', or null
  history: array,        // Move history with details
  legalMoves: array     // All legal moves for current position
}
```

### stockfishPlayer.js

Interfaces with the Stockfish chess engine using the UCI (Universal Chess Interface) protocol via the node-uci library.

**Key methods:**
- `init(stockfishPath)` - Initialize Stockfish engine
- `getBestMove(fen)` - Get Stockfish's recommended move
- `setDifficulty(level)` - Set skill level (0-20)
- `getEvaluation(fen)` - Get position evaluation score

**How it works:**
1. Uses node-uci to communicate with Stockfish process
2. Sends position via UCI `position` command
3. Requests best move via UCI `go` command
4. Parses UCI output for best move and evaluation

**Difficulty levels:**
- Level 5: Easy (beginner)
- Level 10: Medium (intermediate)
- Level 15: Hard (advanced)
- Level 20: Expert (master)

### llmPlayer.js

Handles communication with the Groq API for AI commentary.

**Key functions:**
- `initGroq(apiKey)` - Initialize Groq client
- `makeMoveWithComment(gameState, playerMove, personality)` - Get AI move + commentary
- `generateCommentary(gameState, lastMove, personality, isGameOver, result)` - Generate commentary
- `generateMoveExplanation(state, moveNotation)` - Explain a move

**LLM Configuration:**
- Model: `llama-3.1-8b-instant` (free tier)
- Temperature: 0.9 (creative responses)
- Max tokens: 300

**Response format from LLM:**
```
"Some funny commentary about the position...
MOVE: e7e5"
```

The LLM is instructed to always end responses with `MOVE:` followed by the move in UCI format (e.g., `e7e5`).

### prompts.js

Defines the AI personalities using system prompts for the LLM.

**Available personalities:**
1. **Sassy Sarah** - Sarcastic, condescending, thinks she's better than everyone
2. **Grandma Gladys** - Sweet, overly supportive, finds everything "wonderful"
3. **Commentator Carl** - Dramatic sports commentator, hypes up moves
4. **Trash Talker Tony** - Overly confident, constantly brags and insults
5. **Confused Carl** - Easily confused, bewildered by moves

**Personality structure:**
```javascript
{
  id: string,           // Unique identifier
  name: string,         // Display name
  system: string         // System prompt for LLM
}
```

### script.js (Frontend)

Handles all frontend logic including:
- Board rendering (SVG pieces)
- User interaction (click handling)
- Timer management
- API calls to backend
- Voice synthesis
- Sound effects

**Key functions:**
- `fetchGameState()` - Load initial state from server
- `makeMove(from, to, promotion)` - Send move to server
- `renderBoard(legalMoves, history)` - Draw the board
- `startTimerForCurrentTurn()` - Manage game clock
- `updateEvaluation()` - Fetch and display position analysis

### index.html

Main HTML file with:
- Board container
- Control buttons (New Game, Flip Board, Undo, Hint)
- Settings (difficulty, time control, theme)
- Commentary display
- Timer displays
- Evaluation bar
- Move history

### style.css

CSS styling including:
- Board grid layout (8x8)
- Square colors for each theme
- Piece rendering
- Move highlights
- Selected square indicator
- Last move highlighting

**Available themes:**
- Classic (green/cream)
- Blue
- Wood
- Purple
- Dark

## Features Explained

### Timer System

The timer uses JavaScript's `setInterval` to decrement time every second.

**How it works:**
1. User selects time control (3+0, 5+0, 10+0, 15+0, unlimited)
2. When user makes a move, `currentTurn` is set to 'b' (black)
3. Black's clock starts counting down
4. After AI responds, `currentTurn` switches back to 'w'
5. White's clock resumes

**Code flow:**
```
User clicks piece → selects destination → makeMove() called
  ↓
setLoading(true) - show spinner
  ↓
currentTurn = 'b' - switch to AI's turn
  ↓
startTimerForCurrentTurn() - start black's clock
  ↓
fetch('/api/move') - send move to server
  ↓
Server processes: user move → AI move → LLM commentary
  ↓
Response received → updateBoard() → startTimerForCurrentTurn() (now white's turn)
```

### Evaluation Bar

The evaluation bar shows Stockfish's assessment of the current position.

**How it works:**
1. After each move, frontend calls `/api/evaluate`
2. Backend sends position to Stockfish with depth 10
3. Stockfish returns score (centipawns, converted to pawns)
4. Frontend updates visual bar:
   - Positive score → bar extends right (white advantage)
   - Negative score → bar extends left (black advantage)
   - Near 0 → bar in center (equal position)

**Score interpretation:**
- ±0.1: Equal
- ±0.5: Slight advantage
- ±1.0: Clear advantage
- ±3.0: Winning advantage
- Mate: Checkmate imminent

### Voice Commentary

Uses the Web Speech API (SpeechSynthesis) to read opponent comments aloud.

**How it works:**
1. User enables voice toggle
2. When AI comments, `speakText(comment)` is called
3. Creates SpeechSynthesisUtterance with the comment
4. Browser's speech engine reads it aloud

**Configuration:**
```javascript
utterance.rate = 0.9;    // Slightly slower
utterance.pitch = 1;     // Normal pitch
```

### Move Explanations

When "Explain Moves" checkbox is enabled, the LLM provides plain-English explanations of moves.

**How it works:**
1. User makes move with `explain: true`
2. Server calls `generateMoveExplanation()` with game state
3. LLM analyzes the position and explains the move
4. Explanation displayed below the board

### Sound Effects

Uses Web Audio API for move sounds.

**Sound types:**
- Move: Gentle piece movement
- Capture: Piece capture
- Check: King in check alert
- Mistake: Error sound
- Blunder: Major error sound
- Game Over: Match conclusion

### Undo System

Allows users to take back their last move and the AI's response.

**How it works:**
1. User clicks Undo button
2. Server calls `game.undoLastTwoMoves()`
3. This undoes both the user's move AND the AI's response
4. Returns updated state to frontend

### Hint System

Shows the best move according to Stockfish.

**How it works:**
1. User clicks Hint button
2. Server calls `stockfish.getBestMove(fen)`
3. Stockfish analyzes position and returns best move
4. Frontend highlights the hint square with purple border

### Board Themes

Multiple visual themes stored in CSS:

```css
.board.theme-classic .square.light { background-color: #eeeed2; }
.board.theme-classic .square.dark  { background-color: #769656; }

.board.theme-blue .square.light    { background-color: #f0d9b5; }
.board.theme-blue .square.dark     { background-color: #b58863; }
/* ... etc */
```

## Customizing AI Personalities

To add or modify personalities, edit `src/prompts.js`:

```javascript
// Add new personality
personalities: {
  // ... existing personalities ...
  
  chill: {
    name: "Chill Charlie",
    system: `You are Charlie, a relaxed chess player...
    Keep responses SHORT - 1-2 sentences maximum.
    Never use markdown or formatting.`
  }
}
```

**Tips for good personalities:**
- Keep system prompts short and focused
- Specify response length (1-2 sentences)
- Emphasize "never use markdown" to get clean text
- Give distinctive speech patterns or catchphrases

## Resume Highlights

This project demonstrates the following skills (great for your resume):

### Backend Skills
- **Node.js & Express** - Building REST APIs, handling HTTP requests
- **Chess Logic** - Implementing game rules with chess.js library
- **Stockfish Integration** - UCI protocol communication via node-uci
- **External API Integration** - Groq LLM API with error handling

### Frontend Skills
- **Vanilla JavaScript** - DOM manipulation, event handling, async/await
- **CSS Styling** - Tailwind CSS, custom themes, responsive design
- **Web APIs** - Speech Synthesis, Web Audio API
- **SVG Graphics** - Chess piece rendering

### System Skills
- **Game Logic** - Turn management, timer systems, move validation
- **State Management** - Server-side game state, client sync
- **Deployment** - Oracle Cloud Free Tier, process management

### Key Technical Achievements
1. Integrated Stockfish chess engine with Node.js using UCI protocol
2. Created real-time position evaluation with visual feedback
3. Implemented multi-personality AI using LLM with structured prompts
4. Built turn-based timer system with proper state management
5. Added voice commentary using browser's Web Speech API

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Stockfish chess engine installed at `/usr/games/stockfish`
- Groq API key (free at groq.com)

### Local Development

1. **Clone and install:**
```bash
cd chess-app
npm install
```

2. **Set up environment variables:**
```bash
# Create .env file
echo "GROQ_API_KEY=your_api_key_here" > .env
echo "PORT=5000" >> .env
```

3. **Get Groq API key:**
   - Go to https://console.groq.com
   - Create free account
   - Copy API key from dashboard

4. **Install Stockfish:**
```bash
# On Ubuntu/Debian
sudo apt-get install stockfish

# Or download from https://stockfishchess.org/download/
```

5. **Start the server:**
```bash
npm start
# or
node server.js
```

6. **Open in browser:**
```
http://localhost:5000
```

### Development Mode

For auto-restart on file changes:
```bash
npm install -g nodemon
nodemon server.js
```

## Oracle Cloud Free Tier Deployment

### Step 1: Create Oracle Cloud Account
1. Go to https://www.oracle.com/cloud/free/
2. Create free account (requires credit card for verification)
3. Wait for account activation

### Step 2: Create Compute Instance
1. Log into Oracle Cloud Console
2. Navigate to Compute → Instances
3. Click "Create Instance"
4. Configure:
   - Name: chess-app
   - Image: Oracle Linux 8 (free tier)
   - Shape: Always Free (VM.Standard.E2.1.Micro)
   - SSH Key: Add your public key

5. Click "Create" and wait for provisioning

### Step 3: Connect to Instance
```bash
ssh opc@<your-public-ip>
```

### Step 4: Install Required Software
```bash
# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Stockfish
sudo yum install -y stockfish

# Verify installations
node --version
stockfish
```

### Step 5: Deploy Application
```bash
# Create app directory
mkdir chess-app && cd chess-app

# Upload files (from your local machine)
# Option A: Git clone
git clone <your-repo-url> .

# Option B: SCP
scp -r /path/to/chess-app/* opc@<your-ip>:~/chess-app/

# Install dependencies
npm install

# Set environment variable
echo "GROQ_API_KEY=your_key_here" > .env
```

### Step 6: Run with PM2
```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start server.js

# Set up startup script
pm2 startup
pm2 save
```

### Step 7: Configure Firewall
```bash
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### Step 8: Access Application
```
http://<your-public-ip>:5000
```

### Troubleshooting Oracle Deployment

**Issue: Port not accessible**
- Check security list rules in Oracle Console
- Add ingress rule for port 5000

**Issue: Stockfish not found**
- Verify installation: `which stockfish`
- Check path in server.js matches installation location

**Issue: Node process crashes**
- Check PM2 logs: `pm2 logs`
- Common issues: missing dependencies, port already in use

## Troubleshooting

### Common Issues and Solutions

#### 1. Stockfish Not Found

**Error:**
```
Error: spawn stockfish ENOENT
```

**Solution:**
- Install Stockfish: `sudo apt-get install stockfish` (Ubuntu) or `brew install stockfish` (macOS)
- Verify path: `which stockfish`
- Update path in server.js if different: `stockfish.init('/usr/games/stockfish')`

#### 2. Groq API Key Issues

**Error:**
```
Groq API error: Invalid API Key
```

**Solution:**
- Check .env file exists and has correct format: `GROQ_API_KEY=your_key`
- Verify API key is active at https://console.groq.com
- Restart server after changing .env

#### 3. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
- Find process: `lsof -i :5000`
- Kill process: `kill <PID>`
- Or use different port: `PORT=3000 npm start`

#### 4. Evaluation Returning Null/0

**Error:**
```json
{"score":0}
```

**Solution:**
- Check Stockfish is running: `stockfish` (command line)
- Verify node-uci initialization in server logs
- Check server logs for UCI communication errors
- Ensure depth parameter is passed: `engine.go({ depth: 10 })`

#### 5. Board Not Rendering

**Error:** Blank board, no pieces showing

**Solution:**
- Check browser console for JavaScript errors
- Verify SVG pieces file exists at `/public/pieces/standard.svg`
- Check that `boardElement` is correctly selected in JavaScript

#### 6. Timer Not Working

**Issue:** Timer stays at same value or only one clock runs

**Solution:**
- Check `currentTurn` variable is being updated after moves
- Ensure `startTimerForCurrentTurn()` is called after each move
- Verify `setInterval` is not creating multiple timers (call `stopTimer()` first)

#### 7. Voice Not Working

**Issue:** Voice commentary doesn't speak

**Solution:**
- Check browser supports SpeechSynthesis API
- User must interact with page first (browser security)
- Verify voice toggle is enabled
- Check if browser has available voices: `speechSynthesis.getVoices()`

#### 8. Move Validation Issues

**Error:** "Illegal move" when making valid move

**Solution:**
- Check chess.js is properly initialized
- Verify FEN string is valid
- Check legalMoves array is being passed correctly

#### 9. Memory/Performance Issues

**Issue:** Server runs slowly after many games

**Solution:**
- Restart Stockfish periodically
- Clear move history: `game.reset()`
- Use PM2 with memory monitoring: `pm2 monit`

#### 10. LLM Commentary Not Working

**Error:** "Groq client not initialized" or no commentary

**Solution:**
- Verify GROQ_API_KEY is set: `echo $GROQ_API_KEY`
- Check API key has remaining quota
- Verify model name is correct: `llama-3.1-8b-instant`
- Check network connectivity to groq.com

### Debug Mode

To enable verbose debugging:

1. **Server logs:**
```javascript
// In stockfishPlayer.js, add console.log:
console.log('Stockfish command:', command);
console.log('Stockfish output:', data);
```

2. **Frontend logs:**
```javascript
// In browser console:
localStorage.debug = '*';
```

3. **API testing:**
```bash
# Test state endpoint
curl http://localhost:5000/api/state

# Test move endpoint
curl -X POST http://localhost:5000/api/move \
  -H "Content-Type: application/json" \
  -d '{"from":"e2","to":"e4"}'
```

### Getting Help

- **chess.js docs:** https://github.com/jhlywa/chess.js
- **node-uci docs:** https://github.com/h的时代可用stockfish
- **Groq docs:** https://docs.groq.com/
- **Stockfish UCI:** https://www.chessprogramming.org/UCI

---

*This documentation was created to help understand and maintain the Chatty Carl Chess application.*
