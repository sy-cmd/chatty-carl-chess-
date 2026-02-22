const PIECE_IDS = {
  'p': 'bp', 'r': 'br', 'n': 'bn', 'b': 'bb', 'q': 'bq', 'k': 'bk',
  'P': 'wp', 'R': 'wr', 'N': 'wn', 'B': 'wb', 'Q': 'wq', 'K': 'wk'
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

let board = [];
let selectedSquare = null;
let currentTurn = 'w';
let gameOver = false;
let legalMoves = [];
let moveHistory = [];
let lastMove = null;
let boardFlipped = false;
let theme = 'classic';
let timeControl = 600;
let whiteTime = 600;
let blackTime = 600;
let timerInterval = null;
let gameStarted = false;
let undoStack = [];
let difficulty = 10;
let pendingPromotion = null;
let evaluation = 0;

const boardElement = document.getElementById('board');
const turnDisplay = document.getElementById('turnDisplay');
const checkIndicator = document.getElementById('checkIndicator');
const gameOverDisplay = document.getElementById('gameOverDisplay');
const moveHistoryElement = document.getElementById('moveHistory');
const opponentComment = document.getElementById('opponentComment');
const loadingIndicator = document.getElementById('loadingIndicator');
const personalitySelect = document.getElementById('personalitySelect');
const opponentName = document.getElementById('opponentName');
const newGameBtn = document.getElementById('newGameBtn');
const flipBoardBtn = document.getElementById('flipBoardBtn');
const undoBtn = document.getElementById('undoBtn');
const hintBtn = document.getElementById('hintBtn');
const themeSelect = document.getElementById('themeSelect');
const difficultySelect = document.getElementById('difficultySelect');
const timeControlSelect = document.getElementById('timeControl');
const showCoordinatesCheckbox = document.getElementById('showCoordinates');
const soundEffectsCheckbox = document.getElementById('soundEffects');
const explainMovesCheckbox = document.getElementById('explainMoves');
const whiteTimerEl = document.getElementById('whiteTimer');
const blackTimerEl = document.getElementById('blackTimer');
const moveExplanationEl = document.getElementById('moveExplanation');
const mistakeCounterEl = document.getElementById('mistakeCounter');
const mistakeCountEl = document.getElementById('mistakeCount');
const blunderCountEl = document.getElementById('blunderCount');
const promotionDialog = document.getElementById('promotionDialog');
const evalBar = document.getElementById('evalBar');
const evalScore = document.getElementById('evalScore');

let voiceEnabled = false;
const voiceToggle = document.getElementById('voiceToggle');
const voiceBtnText = document.getElementById('voiceBtnText');
const voiceIcon = document.getElementById('voiceIcon');
const autoVoiceCheckbox = document.getElementById('autoVoice');

function speakText(text) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  if (englishVoice) utterance.voice = englishVoice;
  window.speechSynthesis.speak(utterance);
}

voiceToggle.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  if (voiceEnabled) {
    voiceBtnText.textContent = 'Voice On';
    voiceIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />';
    voiceToggle.classList.add('bg-green-600');
    voiceToggle.classList.remove('bg-gray-700');
  } else {
    voiceBtnText.textContent = 'Voice';
    voiceIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />';
    voiceToggle.classList.remove('bg-green-600');
    voiceToggle.classList.add('bg-gray-700');
    window.speechSynthesis.cancel();
  }
});

async function fetchGameState() {
  try {
    const response = await fetch('/api/state');
    const state = await response.json();
    updateBoard(state);
  } catch (error) {
    console.error('Failed to fetch game state:', error);
  }
}

async function makeMove(from, to, promotion = 'q') {
  if (gameOver || currentTurn !== 'w') return;

  setLoading(true);
  currentTurn = 'b';
  startTimerForCurrentTurn();
  
  try {
    const response = await fetch('/api/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, promotion, difficulty, explain: explainMovesCheckbox.checked })
    });

    const result = await response.json();
    
    if (result.success) {
      undoStack.push({ from, to, stateBefore: getBoardState() });
      
      updateBoard(result.state);
      
      if (result.llmComment) {
        opponentComment.textContent = result.llmComment;
        if (autoVoiceCheckbox.checked) {
          speakText(result.llmComment);
        }
      }
      
      if (result.moveExplanation) {
        moveExplanationEl.textContent = result.moveExplanation;
        moveExplanationEl.classList.remove('hidden');
      }
      
      addMoveToHistory(from + '-' + to);
      
      playSound('move');
      
      if (result.mistakeDetected) {
        mistakeCount++;
        mistakeCountEl.textContent = mistakeCount;
        mistakeCounterEl.classList.remove('hidden');
        playSound('mistake');
      }
      
      if (result.blunderDetected) {
        blunderCount++;
        blunderCountEl.textContent = blunderCount;
        playSound('blunder');
      }
      
      if (result.gameOver) {
        gameOver = true;
        gameOverDisplay.textContent = result.result;
        gameOverDisplay.classList.remove('hidden');
        stopTimer();
        playSound('gameOver');
        
        if (result.result.includes('White wins')) {
          opponentComment.textContent = result.llmComment || "Fine, you won...";
        } else if (result.result.includes('Black wins')) {
          opponentComment.textContent = result.llmComment || "I win! Better luck next time!";
        }
      } else {
        startTimerForCurrentTurn();
        updateEvaluation();
      }
    } else {
      console.error('Move failed:', result.error);
      opponentComment.textContent = "Nice try, but that's not a valid move!";
    }
  } catch (error) {
    console.error('Move error:', error);
    opponentComment.textContent = "Oops! Something went wrong. Try again!";
  } finally {
    setLoading(false);
  }
}

function getBoardState() {
  return JSON.stringify(board);
}

function updateBoard(state) {
  const fen = state.fen;
  currentTurn = state.turn;
  gameOver = state.gameOver;
  
  turnDisplay.textContent = currentTurn === 'w' ? "White (Your turn)" : "Black (Carl's turn)";
  
  checkIndicator.classList.toggle('hidden', !state.inCheck);
  
  const boardArray = fen.split(' ')[0].split('/');
  board = [];
  
  for (let row = 0; row < 8; row++) {
    const rowStr = boardArray[row];
    const rowPieces = [];
    let col = 0;
    
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      const num = parseInt(char);
      
      if (!isNaN(num)) {
        for (let j = 0; j < num; j++) {
          rowPieces.push(null);
          col++;
        }
      } else {
        const isWhite = char === char.toUpperCase();
        rowPieces.push({
          type: char.toLowerCase(),
          color: isWhite ? 'white' : 'black'
        });
        col++;
      }
    }
    board.push(rowPieces);
  }
  
  renderBoard(state.legalMoves || [], state.history || []);
}

function renderBoard(legalMovesData, history) {
  boardElement.innerHTML = '';
  boardElement.className = `board theme-${theme}`;
  
  if (showCoordinatesCheckbox.checked) {
    boardElement.classList.add('with-coordinates');
  }
  
  const highlightedSquares = new Set();
  const capturedSquares = new Set();
  
  if (legalMovesData && legalMovesData.length > 0 && selectedSquare) {
    legalMovesData.forEach(move => {
      if (move.from === selectedSquare) {
        highlightedSquares.add(move.to);
        if (move.flags && move.flags.includes('c')) {
          capturedSquares.add(move.to);
        }
      }
    });
  }
  
  let lastMoveSquares = new Set();
  if (history && history.length > 0) {
    const lastMoveObj = history[history.length - 1];
    if (lastMoveObj) {
      lastMoveSquares.add(lastMoveObj.from);
      lastMoveSquares.add(lastMoveObj.to);
    }
  }
  
  const ranks = boardFlipped ? RANKS : RANKS.slice().reverse();
  const files = boardFlipped ? FILES.slice().reverse() : FILES;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      const displayRow = boardFlipped ? 7 - row : row;
      const displayCol = boardFlipped ? 7 - col : col;
      const isDark = (displayRow + displayCol) % 2 === 1;
      const squareName = FILES[displayCol] + RANKS[displayRow];
      
      square.className = `square ${isDark ? 'dark' : 'light'}`;
      square.dataset.file = FILES[displayCol];
      square.dataset.rank = RANKS[displayRow];
      
      if (selectedSquare === squareName) {
        square.classList.add('selected');
      }
      
      if (highlightedSquares.has(squareName)) {
        square.classList.add('highlight');
        if (capturedSquares.has(squareName)) {
          square.classList.add('capture');
        }
      }
      
      if (lastMoveSquares.has(squareName)) {
        square.classList.add('last-move');
      }
      
      const piece = board[row][col];
      if (piece) {
        const pieceSpan = document.createElement('span');
        pieceSpan.className = `piece ${piece.color}`;
        
        const pieceChar = piece.color === 'white' ? piece.type.toUpperCase() : piece.type;
        const pieceId = PIECE_IDS[pieceChar];
        
        pieceSpan.innerHTML = `<svg viewBox="0 0 40 40"><use href="/pieces/standard.svg#${pieceId}"></use></svg>`;
        square.appendChild(pieceSpan);
      }
      
      square.addEventListener('click', () => handleSquareClick(squareName));
      boardElement.appendChild(square);
    }
  }
}

async function handleSquareClick(square) {
  if (gameOver) return;
  
  if (currentTurn !== 'w') {
    opponentComment.textContent = "Wait your turn! I'm thinking...";
    return;
  }
  
  if (!selectedSquare) {
    const piece = getPieceAt(square);
    if (piece && piece.color === 'white') {
      selectedSquare = square;
      await fetchLegalMoves(square);
    }
  } else {
    if (selectedSquare === square) {
      selectedSquare = null;
      renderBoard([], []);
    } else {
      const isLegal = legalMoves.some(m => m.from === selectedSquare && m.to === square);
      
      if (isLegal) {
        const moveObj = legalMoves.find(m => m.from === selectedSquare && m.to === square);
        
        if (moveObj && moveObj.flags && moveObj.flags.includes('p')) {
          pendingPromotion = { from: selectedSquare, to: square };
          promotionDialog.classList.remove('hidden');
          return;
        } else {
          await makeMove(selectedSquare, square);
        }
        selectedSquare = null;
        legalMoves = [];
      } else {
        const piece = getPieceAt(square);
        if (piece && piece.color === 'white') {
          selectedSquare = square;
          await fetchLegalMoves(square);
        } else {
          selectedSquare = null;
          renderBoard([], []);
        }
      }
    }
  }
}

async function fetchLegalMoves(square) {
  try {
    const response = await fetch(`/api/state`);
    const state = await response.json();
    
    if (state.legalMoves) {
      legalMoves = state.legalMoves.filter(m => m.from === square);
      renderBoard(legalMoves, state.history || []);
    }
  } catch (error) {
    console.error('Failed to fetch legal moves:', error);
  }
}

function getPieceAt(square) {
  const col = FILES.indexOf(square[0]);
  const row = RANKS.indexOf(square[1]);
  
  if (col === -1 || row === -1) return null;
  return board[row][col];
}

function addMoveToHistory(move) {
  moveHistory.push(move);
  
  let historyHTML = '';
  for (let i = 0; i < moveHistory.length; i += 2) {
    const num = Math.ceil((i + 1) / 2);
    const whiteMove = moveHistory[i] || '';
    const blackMove = moveHistory[i + 1] || '';
    
    historyHTML += `<div class="flex gap-2">
      <span class="text-gray-500 w-6">${num}.</span>
      <span class="w-16">${whiteMove}</span>
      <span class="w-16">${blackMove}</span>
    </div>`;
  }
  
  moveHistoryElement.innerHTML = historyHTML;
  moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
}

function setLoading(loading) {
  loadingIndicator.classList.toggle('hidden', !loading);
}

async function changePersonality(personality) {
  try {
    const response = await fetch('/api/personality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personality })
    });
    
    const result = await response.json();
    if (result.success) {
      opponentName.textContent = result.name;
    }
  } catch (error) {
    console.error('Failed to change personality:', error);
  }
}

async function resetGame() {
  try {
    const response = await fetch('/api/reset', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      selectedSquare = null;
      gameOver = false;
      moveHistory = [];
      lastMove = null;
      undoStack = [];
      mistakeCount = 0;
      blunderCount = 0;
      
      gameOverDisplay.classList.add('hidden');
      moveExplanationEl.classList.add('hidden');
      mistakeCounterEl.classList.add('hidden');
      moveHistoryElement.innerHTML = '<span class="text-gray-500">No moves yet...</span>';
      opponentComment.textContent = "Let's play! I'll crush you! ♟️";
      
      updateBoard(result.state);
      startTimerForCurrentTurn();
      updateEvaluation();
    }
  } catch (error) {
    console.error('Failed to reset game:', error);
  }
}

function flipBoard() {
  boardFlipped = !boardFlipped;
  fetchGameState();
}

async function undoMove() {
  if (undoStack.length < 1) {
    opponentComment.textContent = "Nothing to undo!";
    return;
  }
  
  try {
    const response = await fetch('/api/undo', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      undoStack.pop();
      updateBoard(result.state);
      opponentComment.textContent = "Move undone! Your turn again.";
      
      if (moveHistory.length >= 2) {
        moveHistory.pop();
        moveHistory.pop();
        addMoveToHistory('');
        moveHistory.pop();
        moveHistory.pop();
      }
      
      const newHistoryHTML = moveHistoryElement.innerHTML.split('\n').slice(0, -2).join('\n');
      moveHistoryElement.innerHTML = newHistoryHTML || '<span class="text-gray-500">No moves yet...</span>';
    }
  } catch (error) {
    console.error('Failed to undo:', error);
  }
}

async function getHint() {
  if (gameOver || currentTurn !== 'w') return;
  
  try {
    setLoading(true);
    const response = await fetch('/api/hint', { method: 'POST' });
    const result = await response.json();
    
    if (result.hint) {
      const hintSquares = document.querySelectorAll('.square');
      hintSquares.forEach(sq => {
        if (sq.textContent.includes(result.hint.from) || sq.textContent.includes(result.hint.to)) {
          sq.classList.add('hint');
        }
      });
      
      opponentComment.textContent = `Hint: Try moving from ${result.hint.from} to ${result.hint.to}`;
      
      setTimeout(() => {
        document.querySelectorAll('.square.hint').forEach(sq => sq.classList.remove('hint'));
      }, 3000);
    }
  } catch (error) {
    console.error('Failed to get hint:', error);
  } finally {
    setLoading(false);
  }
}

function startTimer() {
  stopTimer();
  gameStarted = true;
  whiteTime = timeControl;
  blackTime = timeControl;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    if (currentTurn === 'w') {
      whiteTime--;
      if (whiteTime <= 0) {
        whiteTime = 0;
        handleTimeout('White');
      }
    } else {
      blackTime--;
      if (blackTime <= 0) {
        blackTime = 0;
        handleTimeout('Black');
      }
    }
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  whiteTimerEl.textContent = formatTime(whiteTime);
  blackTimerEl.textContent = formatTime(blackTime);
  
  whiteTimerEl.classList.toggle('low-time', whiteTime <= 30 && whiteTime > 0);
  blackTimerEl.classList.toggle('low-time', blackTime <= 30 && blackTime > 0);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startTimerForCurrentTurn() {
  stopTimer();
  
  timerInterval = setInterval(() => {
    if (currentTurn === 'w') {
      whiteTime--;
      if (whiteTime <= 0) {
        whiteTime = 0;
        handleTimeout('White');
        return;
      }
    } else {
      blackTime--;
      if (blackTime <= 0) {
        blackTime = 0;
        handleTimeout('Black');
        return;
      }
    }
    updateTimerDisplay();
  }, 1000);
  
  updateTimerDisplay();
}

async function updateEvaluation() {
  try {
    const response = await fetch('/api/evaluate', { method: 'POST' });
    const data = await response.json();
    
    if (data.score !== undefined) {
      evaluation = data.score;
      updateEvalBar(evaluation);
    }
  } catch (error) {
    console.error('Evaluation error:', error);
  }
}

function updateEvalBar(score) {
  const maxScore = 10;
  const normalizedScore = Math.max(-maxScore, Math.min(maxScore, score));
  const percentage = (normalizedScore / maxScore) * 50;
  
  let barColor;
  if (score > 0.5) {
    barColor = '#22c55e';
  } else if (score < -0.5) {
    barColor = '#ef4444';
  } else {
    barColor = '#6b7280';
  }
  
  if (score >= 0) {
    evalBar.style.left = '50%';
    evalBar.style.width = `${percentage}%`;
    evalBar.style.backgroundColor = barColor;
  } else {
    evalBar.style.left = `${50 - percentage}%`;
    evalBar.style.width = `${percentage}%`;
    evalBar.style.backgroundColor = barColor;
  }
  
  const sign = score > 0 ? '+' : '';
  evalScore.textContent = `${sign}${score.toFixed(1)}`;
  
  if (score > 2) {
    evalScore.textContent += ' (Winning)';
  } else if (score < -2) {
    evalScore.textContent += ' (Losing)';
  }
}

function handleTimeout(side) {
  stopTimer();
  gameOver = true;
  const result = side === 'White' ? 'Black wins on time!' : 'White wins on time!';
  gameOverDisplay.textContent = result;
  gameOverDisplay.classList.remove('hidden');
  opponentComment.textContent = side === 'White' ? "Time's up! I win!" : "You ran out of time!";
}

function changeTheme(newTheme) {
  theme = newTheme;
  fetchGameState();
}

function changeDifficulty(level) {
  difficulty = parseInt(level);
  fetch('/api/difficulty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty })
  });
}

function changeTimeControl(time) {
  timeControl = parseInt(time);
  if (!gameStarted) {
    whiteTime = timeControl;
    blackTime = timeControl;
    updateTimerDisplay();
  }
}

function toggleCoordinates() {
  fetchGameState();
}

function playSound(type) {
  if (!soundEffectsCheckbox.checked) return;
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const frequencies = {
    move: 440,
    capture: 330,
    check: 550,
    mistake: 300,
    blunder: 200,
    gameOver: 660
  };
  
  oscillator.frequency.value = frequencies[type] || 440;
  oscillator.type = type === 'move' ? 'sine' : 'square';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

document.querySelectorAll('.promotion-piece').forEach(btn => {
  btn.addEventListener('click', async () => {
    const piece = btn.dataset.piece;
    if (pendingPromotion) {
      await makeMove(pendingPromotion.from, pendingPromotion.to, piece);
      pendingPromotion = null;
      promotionDialog.classList.add('hidden');
    }
  });
});

personalitySelect.addEventListener('change', (e) => changePersonality(e.target.value));
newGameBtn.addEventListener('click', resetGame);
flipBoardBtn.addEventListener('click', flipBoard);
undoBtn.addEventListener('click', undoMove);
hintBtn.addEventListener('click', getHint);
themeSelect.addEventListener('change', (e) => changeTheme(e.target.value));
difficultySelect.addEventListener('change', (e) => changeDifficulty(e.target.value));
timeControlSelect.addEventListener('change', (e) => changeTimeControl(e.target.value));
showCoordinatesCheckbox.addEventListener('change', toggleCoordinates);

fetchGameState();
