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

let capturedWhite = [];
let capturedBlack = [];
let mistakeCount = 0;
let blunderCount = 0;

let gameMode = 'ai';
let playerColor = 'white';

const boardElement = document.getElementById('board');
const turnDisplay = document.getElementById('turnDisplay');
const checkIndicator = document.getElementById('checkIndicator');
const gameOverDisplay = document.getElementById('gameOverDisplay');
const moveHistoryElement = document.getElementById('moveHistory');
const opponentComment = document.getElementById('opponentComment');
const loadingIndicator = document.getElementById('loadingIndicator');
const personalitySelect = document.getElementById('personalitySelect');
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
const capturedWhiteEl = document.getElementById('capturedWhite');
const capturedBlackEl = document.getElementById('capturedBlack');
const materialAdvantageEl = document.getElementById('materialAdvantage');
const opponentAvatar = document.getElementById('opponentAvatar');
const opponentName = null;

let voiceEnabled = false;
const voiceToggle = document.getElementById('voiceToggle');
const voiceBtnText = document.getElementById('voiceBtnText');
const voiceIcon = document.getElementById('voiceIcon');
const autoVoiceCheckbox = document.getElementById('autoVoice');
const announceMovesCheckbox = document.getElementById('announceMoves');

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency, duration, type = 'sine', volume = 0.15) {
  if (!soundEffectsCheckbox.checked) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

function playArpeggio(notes, interval = 100) {
  if (!soundEffectsCheckbox.checked) return;
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.12), i * interval);
  });
}

function playSound(type) {
  if (!soundEffectsCheckbox.checked) return;
  
  const sounds = {
    move: () => playTone(523.25, 0.08, 'sine', 0.1),
    capture: () => playTone(261.63, 0.12, 'triangle', 0.15),
    check: () => {
      playTone(880, 0.1, 'sine', 0.12);
      setTimeout(() => playTone(1108.73, 0.15, 'sine', 0.12), 100);
    },
    mistake: () => {
      playTone(392, 0.15, 'square', 0.08);
      setTimeout(() => playTone(349.23, 0.15, 'square', 0.08), 150);
    },
    blunder: () => {
      playTone(311.13, 0.2, 'sawtooth', 0.08);
      setTimeout(() => playTone(233.08, 0.25, 'sawtooth', 0.08), 200);
    },
    gameOver: () => playArpeggio([523.25, 659.25, 783.99, 1046.5], 120),
    promotion: () => playArpeggio([783.99, 987.77, 1174.66], 80)
  };
  
  if (sounds[type]) sounds[type]();
}

let selectedVoiceType = 'male';
let selectedVoiceId = 'alloy';
let availableVoices = [];
let voicesLoaded = false;
let googleVoices = [];
let personalityVoices = {};
let currentPersonality = 'sassy';
let usePuterTTS = true;
let currentAudio = null;

function loadVoices() {
  availableVoices = window.speechSynthesis.getVoices();
  voicesLoaded = availableVoices.length > 0;
}

async function loadOpenAIVoices() {
  try {
    const response = await fetch('/api/voices');
    const data = await response.json();
    googleVoices = data.voices;
    personalityVoices = data.personalityVoices;
    
    const voiceSelector = document.getElementById('voiceSelector');
    if (voiceSelector) {
      voiceSelector.innerHTML = '';
      
      const groupedVoices = {};
      googleVoices.forEach(voice => {
        const key = voice.gender;
        if (!groupedVoices[key]) groupedVoices[key] = [];
        groupedVoices[key].push(voice);
      });
      
      const maleGroup = document.createElement('optgroup');
      maleGroup.label = 'Male Voices';
      groupedVoices['male']?.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.name} - ${voice.description}`;
        maleGroup.appendChild(option);
      });
      
      const femaleGroup = document.createElement('optgroup');
      femaleGroup.label = 'Female Voices';
      groupedVoices['female']?.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.name} - ${voice.description}`;
        femaleGroup.appendChild(option);
      });
      
      const neutralGroup = document.createElement('optgroup');
      neutralGroup.label = 'Neutral Voices';
      groupedVoices['neutral']?.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.name} - ${voice.description}`;
        neutralGroup.appendChild(option);
      });
      
      voiceSelector.appendChild(neutralGroup);
      voiceSelector.appendChild(maleGroup);
      voiceSelector.appendChild(femaleGroup);
      
      const savedVoice = localStorage.getItem('selectedVoiceId');
      if (savedVoice && googleVoices.find(v => v.id === savedVoice)) {
        selectedVoiceId = savedVoice;
        voiceSelector.value = savedVoice;
      } else {
        selectedVoiceId = 'alloy';
        voiceSelector.value = 'alloy';
      }
    }
    
    console.log('Puter TTS ready');
  } catch (error) {
    console.error('Failed to setup TTS:', error);
    usePuterTTS = false;
    
    const voiceSelector = document.getElementById('voiceSelector');
    if (voiceSelector) {
      voiceSelector.innerHTML = '<option value="">Using browser voices</option>';
    }
  }
}

function initTTS() {
  const voiceSelector = document.getElementById('voiceSelector');
  if (voiceSelector) {
    voiceSelector.innerHTML = `
      <optgroup label="Female Voices">
        <option value="Joanna">Joanna - Neural</option>
        <option value="Amy">Amy - Neural</option>
        <option value="Salli">Salli - Neural</option>
        <option value="Ivy">Ivy - Neural</option>
        <option value="Kimberly">Kimberly - Neural</option>
        <option value="Olivia">Olivia - Neural</option>
      </optgroup>
      <optgroup label="Male Voices">
        <option value="Matthew">Matthew - Neural</option>
        <option value="Joey">Joey - Neural</option>
        <option value="Justin">Justin - Neural</option>
        <option value="Brian">Brian - Neural</option>
        <option value="Russell">Russell - Neural</option>
      </optgroup>
    `;
    
    const savedVoice = localStorage.getItem('selectedVoiceId');
    if (savedVoice) {
      selectedVoiceId = savedVoice;
      voiceSelector.value = savedVoice;
    } else {
      selectedVoiceId = 'Joanna';
      voiceSelector.value = 'Joanna';
    }
  }
  
  usePuterTTS = true;
}

setTimeout(initTTS, 1000);

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  setTimeout(loadVoices, 100);
  setTimeout(loadVoices, 500);
  setTimeout(loadVoices, 1000);
}

function getBestVoice(gender = 'male') {
  if (!voicesLoaded) {
    loadVoices();
  }
  
  if (availableVoices.length === 0) return null;
  
  const malePatterns = ['david', 'daniel', 'mark', 'james', 'john', 'richard', 'paul', 'steve', 'will', 'harry', 'male', 'english'];
  const femalePatterns = ['zira', 'susan', 'jenny', 'samantha', 'female', 'eva', 'sara', 'hazel'];
  
  if (gender === 'male') {
    for (const pattern of malePatterns) {
      const voice = availableVoices.find(v => v.name.toLowerCase().includes(pattern) && !v.name.toLowerCase().includes('female'));
      if (voice) return voice;
    }
    for (const pattern of malePatterns) {
      const voice = availableVoices.find(v => v.name.toLowerCase().includes(pattern));
      if (voice) return voice;
    }
  } else {
    for (const pattern of femalePatterns) {
      const voice = availableVoices.find(v => v.name.toLowerCase().includes(pattern));
      if (voice) return voice;
    }
  }
  
  return availableVoices.find(v => v.lang && v.lang.startsWith('en-')) || 
         availableVoices.find(v => v.lang && v.lang.startsWith('en')) ||
         availableVoices[0];
}

function speakText(text, priority = false) {
  if (!voiceEnabled) return;
  
  if (!priority && currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  // Use Puter.js only (Web Speech disabled for testing)
  speakWithPuter(text, priority);
  // speakWithWebSpeech(text, priority);
}

const PUTER_VOICES = {
  // Personality mappings
  sassy: 'Joanna',
  grandma: 'Salli',
  commentator: 'Matthew',
  trash: 'Joey',
  confused: 'Justin',
  // Manual voice selections
  alloy: 'Joanna',
  echo: 'Joey',
  fable: 'Ivy',
  onyx: 'Matthew',
  nova: 'Amy',
  shimmer: 'Salli'
};

async function speakWithPuter(text, priority = false) {
  try {
    const autoVoice = document.getElementById('autoVoice')?.checked;
    let voiceName;
    
    if (autoVoice) {
      // Use personality-based voice
      voiceName = PUTER_VOICES[currentPersonality] || 'Joanna';
    } else {
      // Use manually selected voice
      voiceName = selectedVoiceId || 'Joanna';
    }
    
    console.log('Using voice:', voiceName);
    
    const audio = await puter.ai.txt2speech(text, {
      provider: 'aws-polly',
      voice: voiceName,
      engine: 'neural',
      language: 'en-US'
    });
    
    if (!audio) {
      throw new Error('No audio returned');
    }
    
    // Stop any existing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    
    currentAudio = audio;
    
    audio.onended = () => {
      if (priority && autoVoice && opponentComment?.textContent) {
        setTimeout(() => {
          speakWithPuter(opponentComment.textContent, false);
        }, 500);
      }
    };
    
    audio.onerror = (e) => {
      if (e.error !== 'abort') {
        console.error('Puter audio error:', e);
      }
    };
    
    // Play audio and catch abort errors silently
    try {
      await audio.play();
    } catch (playError) {
      // Ignore abort errors - they happen when audio is interrupted
      if (playError.name !== 'AbortError') {
        console.error('Puter play error:', playError);
      }
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Puter TTS error:', error);
    }
  }
}

function speakWithWebSpeech(text, priority = false) {
  if (!('speechSynthesis' in window)) return;
  
  if (!priority) {
    window.speechSynthesis.cancel();
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  utterance.rate = 0.85;
  utterance.pitch = selectedVoiceType === 'male' ? 0.85 : 1.1;
  utterance.volume = 1;
  
  const voice = getBestVoice(selectedVoiceType);
  if (voice) {
    utterance.voice = voice;
  }
  
  if (priority) {
    utterance.onend = () => {
      if (autoVoiceCheckbox.checked && opponentComment.textContent) {
        const commentUtterance = new SpeechSynthesisUtterance(opponentComment.textContent);
        commentUtterance.rate = 0.85;
        commentUtterance.pitch = selectedVoiceType === 'male' ? 0.85 : 1.1;
        if (voice) commentUtterance.voice = voice;
        window.speechSynthesis.speak(commentUtterance);
      }
    };
  }
  
  window.speechSynthesis.speak(utterance);
}

function announceMove(from, to, isPlayer = true) {
  const files = { a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'ef', g: 'jee', h: 'aych' };
  const ranks = { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight' };
  
  const fromFile = files[from[0]] || from[0];
  const fromRank = ranks[from[1]] || from[1];
  const toFile = files[to[0]] || to[0];
  const toRank = ranks[to[1]] || to[1];
  
  const subject = isPlayer ? 'You moved' : 'Carl moved';
  const text = `${subject} from ${fromFile} ${fromRank} to ${toFile} ${toRank}`;
  
  speakText(text, true);
}

function announceCapture(piece, isPlayer = true) {
  const pieceNames = { p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' };
  const name = pieceNames[piece.toLowerCase()] || piece;
  const subject = isPlayer ? 'You captured' : 'Carl captured';
  speakText(`${subject} the ${name}`, true);
}

function announceCheck(isPlayerInCheck) {
  if (isPlayerInCheck) {
    speakText('Check!', true);
  }
}

function announceGameOver(result) {
  if (result.includes('White wins')) {
    speakText('Game over. You win!', true);
  } else if (result.includes('Black wins')) {
    speakText('Game over. Carl wins!', true);
  } else {
    speakText('Game over. It\'s a draw.', true);
  }
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
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }
});

document.getElementById('voiceSelector').addEventListener('change', (e) => {
  selectedVoiceId = e.target.value;
  localStorage.setItem('selectedVoiceId', selectedVoiceId);
  const testText = `Hello, this is a test of the ${selectedVoiceId} voice. I am ready to play chess.`;
  speakText(testText, true);
});

document.getElementById('testVoiceBtn').addEventListener('click', () => {
  const testText = `Hello, this is a test of the ${selectedVoiceId} voice. I am ready to play chess.`;
  speakText(testText, true);
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

function handleAiMoveResult(result) {
  if (announceMovesCheckbox && announceMovesCheckbox.checked) {
    if (result.state.history && result.state.history.length > 0) {
      const lastMove = result.state.history[result.state.history.length - 1];
      if (lastMove && lastMove.captured) {
        announceCapture(lastMove.captured, true);
      } else if (lastMove && lastMove.promotion) {
        speakText('You promoted to ' + getPieceName(lastMove.promotion), true);
      } else {
        const from = result.state.history[0]?.from || '';
        const to = result.state.history[0]?.to || '';
        if (from) announceMove(from, to, true);
      }
    }
  }
  
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
  
  const lastHistory = result.state.history[result.state.history.length - 1];
  if (lastHistory) {
    addMoveToHistory(lastHistory.from + '-' + lastHistory.to);
  }
  
  if (result.state.inCheck) {
    playSound('check');
    if (announceMovesCheckbox && announceMovesCheckbox.checked) {
      announceCheck(true);
    }
  } else if (result.state.history && result.state.history.length > 0) {
    const lastMove = result.state.history[result.state.history.length - 1];
    if (lastMove && lastMove.captured) {
      addCapturedPiece(lastMove.captured);
      playSound('capture');
    } else if (lastMove && lastMove.promotion) {
      playSound('promotion');
    } else {
      playSound('move');
    }
  } else {
    playSound('move');
  }
  
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
    
    if (announceMovesCheckbox && announceMovesCheckbox.checked) {
      announceGameOver(result.result);
    }
    
    if (result.result.includes('White wins')) {
      opponentComment.textContent = result.llmComment || "Fine, you won...";
    } else if (result.result.includes('Black wins')) {
      opponentComment.textContent = result.llmComment || "I win! Better luck next time!";
    }
  } else {
    if (announceMovesCheckbox && announceMovesCheckbox.checked) {
      if (result.state.history && result.state.history.length > 1) {
        const aiMove = result.state.history[result.state.history.length - 1];
        if (aiMove && aiMove.captured) {
          announceCapture(aiMove.captured, false);
        } else if (aiMove) {
          announceMove(aiMove.from, aiMove.to, false);
        }
      }
    }
    
    if (result.state.inCheck) {
      playSound('check');
      if (announceMovesCheckbox && announceMovesCheckbox.checked) {
        announceCheck(false);
      }
    }
    
    if (result.state.history && result.state.history.length > 0) {
      const lastMove = result.state.history[result.state.history.length - 1];
      if (lastMove && lastMove.captured) {
        addCapturedPiece(lastMove.captured);
        playSound('capture');
      }
    }
    
    startTimerForCurrentTurn();
    updateEvaluation();
  }
}

function handlePvpMoveResult(result, from, to) {
  updateBoard(result.state);
  
  const turnText = result.state.turn === 'w' ? "White's move" : "Black's move";
  opponentComment.textContent = turnText;
  
  if (announceMovesCheckbox && announceMovesCheckbox.checked) {
    const isWhite = result.state.turn === 'w';
    announceMove(from, to, isWhite);
  }
  
  if (result.state.inCheck) {
    playSound('check');
    if (announceMovesCheckbox && announceMovesCheckbox.checked) {
      announceCheck(true);
    }
  } else if (result.state.history && result.state.history.length > 0) {
    const lastMove = result.state.history[result.state.history.length - 1];
    if (lastMove && lastMove.captured) {
      addCapturedPiece(lastMove.captured);
      playSound('capture');
    } else if (lastMove && lastMove.promotion) {
      playSound('promotion');
    } else {
      playSound('move');
    }
  }
  
  addMoveToHistory(from + '-' + to);
  
  if (result.gameOver) {
    gameOver = true;
    gameOverDisplay.textContent = result.result;
    gameOverDisplay.classList.remove('hidden');
    stopTimer();
    playSound('gameOver');
    
    if (announceMovesCheckbox && announceMovesCheckbox.checked) {
      announceGameOver(result.result);
    }
    
    if (result.result.includes('White wins')) {
      opponentComment.textContent = "White wins!";
    } else if (result.result.includes('Black wins')) {
      opponentComment.textContent = "Black wins!";
    } else {
      opponentComment.textContent = "It's a draw!";
    }
  } else {
    startTimerForCurrentTurn();
  }
}

async function makeMove(from, to, promotion = 'q') {
  const isPlayerTurn = gameMode === 'ai' ? currentTurn === 'w' : true;
  
  if (gameOver || !isPlayerTurn) return;

  setLoading(true);
  
  if (gameMode === 'ai') {
    currentTurn = 'b';
    startTimerForCurrentTurn();
  }
  
  try {
    const url = gameMode === 'pvp' ? '/api/pvp-move' : '/api/move';
    const body = gameMode === 'pvp' 
      ? { from, to, promotion }
      : { from, to, promotion, difficulty, explain: explainMovesCheckbox.checked };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.success) {
      undoStack.push({ from, to, stateBefore: getBoardState() });
      
      if (gameMode === 'ai') {
        handleAiMoveResult(result);
      } else {
        handlePvpMoveResult(result, from, to);
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
  
  if (gameMode === 'pvp') {
    const isYourTurn = (playerColor === 'white' && currentTurn === 'w') || 
                       (playerColor === 'black' && currentTurn === 'b');
    turnDisplay.textContent = currentTurn === 'w' ? "White's turn" : "Black's turn";
  } else {
    turnDisplay.textContent = currentTurn === 'w' ? "White (Your turn)" : "Black (Carl's turn)";
  }
  
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
  
  let canMove = true;
  let playerColorCheck = 'white';
  
  if (gameMode === 'ai') {
    canMove = currentTurn === 'w';
    playerColorCheck = 'white';
  } else {
    playerColorCheck = currentTurn === 'w' ? 'white' : 'black';
    canMove = true;
  }
  
  if (!canMove) {
    const waitingText = gameMode === 'pvp' 
      ? (currentTurn === 'w' ? "White's turn - wait!" : "Black's turn - wait!")
      : "Wait your turn! I'm thinking...";
    opponentComment.textContent = waitingText;
    return;
  }
  
  if (!selectedSquare) {
    const piece = getPieceAt(square);
    if (piece && piece.color === playerColorCheck) {
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
  currentPersonality = personality;
  try {
    const response = await fetch('/api/personality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personality })
    });
    
    const result = await response.json();
    if (result.success && opponentName) {
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

const modeAiBtn = document.getElementById('modeAiBtn');
const modePvpBtn = document.getElementById('modePvpBtn');
const pvpColorSelect = document.getElementById('pvpColorSelect');
const pvpControls = document.getElementById('pvpControls');
const difficultySelectEl = document.getElementById('difficultySelect');
const personalitySelectEl = document.getElementById('personalitySelect');
const hintBtnEl = document.getElementById('hintBtn');
const switchSidesBtn = document.getElementById('switchSidesBtn');
const flipBoardPvpBtn = document.getElementById('flipBoardPvpBtn');

async function setGameMode(mode) {
  gameMode = mode;
  
  if (mode === 'pvp') {
    modeAiBtn.classList.remove('active', 'bg-green-600', 'text-white');
    modeAiBtn.classList.add('bg-gray-700', 'text-gray-300');
    modePvpBtn.classList.add('active', 'bg-green-600', 'text-white');
    modePvpBtn.classList.remove('bg-gray-700', 'text-gray-300');
    
    pvpColorSelect.classList.remove('hidden');
    pvpControls.classList.remove('hidden');
    difficultySelectEl.classList.add('hidden');
    personalitySelectEl.classList.add('hidden');
    hintBtnEl.classList.add('hidden');
    
    const color = pvpColorSelect.value;
    if (color === 'random') {
      playerColor = Math.random() > 0.5 ? 'white' : 'black';
    } else {
      playerColor = color;
    }
    
    opponentComment.textContent = "Player vs Player - " + (playerColor === 'white' ? "You are White" : "You are Black");
  } else {
    modeAiBtn.classList.add('active', 'bg-green-600', 'text-white');
    modeAiBtn.classList.remove('bg-gray-700', 'text-gray-300');
    modePvpBtn.classList.remove('active', 'bg-green-600', 'text-white');
    modePvpBtn.classList.add('bg-gray-700', 'text-gray-300');
    
    pvpColorSelect.classList.add('hidden');
    pvpControls.classList.add('hidden');
    difficultySelectEl.classList.remove('hidden');
    personalitySelectEl.classList.remove('hidden');
    hintBtnEl.classList.remove('hidden');
    
    opponentComment.textContent = "Let's play! I'll crush you! ♟️";
  }
  
  try {
    await fetch('/api/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, color: playerColor })
    });
  } catch (err) {
    console.error('Failed to set mode:', err);
  }
  
  resetGame();
}

modeAiBtn.addEventListener('click', () => setGameMode('ai'));
modePvpBtn.addEventListener('click', () => setGameMode('pvp'));

pvpColorSelect.addEventListener('change', () => {
  if (gameMode === 'pvp') {
    setGameMode('pvp');
  }
});

switchSidesBtn.addEventListener('click', () => {
  playerColor = playerColor === 'white' ? 'black' : 'white';
  boardFlipped = !boardFlipped;
  opponentComment.textContent = "Player vs Player - " + (playerColor === 'white' ? "You are White" : "You are Black");
  fetchGameState();
});

flipBoardPvpBtn.addEventListener('click', () => {
  boardFlipped = !boardFlipped;
  fetchGameState();
});

const historyModal = document.getElementById('historyModal');
const analysisModal = document.getElementById('analysisModal');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
const gamesList = document.getElementById('gamesList');

viewHistoryBtn.addEventListener('click', async () => {
  await loadGameHistory();
  historyModal.classList.remove('hidden');
});

closeHistoryBtn.addEventListener('click', () => {
  historyModal.classList.add('hidden');
});

closeAnalysisBtn.addEventListener('click', () => {
  analysisModal.classList.add('hidden');
});

async function loadGameHistory() {
  try {
    const response = await fetch('/api/games?limit=50');
    const games = await response.json();
    
    if (games.length === 0) {
      gamesList.innerHTML = '<p class="text-gray-400">No games yet. Play a game to see it here!</p>';
      return;
    }
    
    gamesList.innerHTML = games.map(game => `
      <div class="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
        <div>
          <div class="text-white font-semibold">vs ${game.opponent} (Level ${game.difficulty})</div>
          <div class="text-sm text-gray-400">${new Date(game.created_at).toLocaleDateString()} - ${game.duration_seconds ? Math.floor(game.duration_seconds / 60) + 'm' : '--'}</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded text-sm font-semibold ${
            game.result === 'win' ? 'bg-green-600 text-white' : 
            game.result === 'loss' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
          }">${game.result === 'win' ? 'Win' : game.result === 'loss' ? 'Loss' : 'Draw'}</span>
          <button class="analyze-btn bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm" data-id="${game.id}">
            Analyze
          </button>
        </div>
      </div>
    `).join('');
    
    document.querySelectorAll('.analyze-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const gameId = e.target.dataset.id;
        await analyzeGame(gameId);
      });
    });
  } catch (error) {
    console.error('Failed to load game history:', error);
    gamesList.innerHTML = '<p class="text-red-400">Failed to load games</p>';
  }
}

async function analyzeGame(gameId) {
  historyModal.classList.add('hidden');
  analysisModal.classList.remove('hidden');
  
  document.getElementById('analysisContent').classList.add('hidden');
  document.getElementById('analysisLoading').classList.remove('hidden');
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: parseInt(gameId) })
    });
    
    const analysis = await response.json();
    
    document.getElementById('analysisAccuracy').textContent = Math.round(analysis.accuracy) + '%';
    document.getElementById('analysisOpening').textContent = analysis.opening || 'Unknown';
    document.getElementById('analysisMistakes').textContent = analysis.mistakes?.length || 0;
    document.getElementById('analysisBlunders').textContent = analysis.blunders?.length || 0;
    
    const moveList = document.getElementById('moveAnalysisList');
    moveList.innerHTML = analysis.moves.map(m => {
      let colorClass = 'text-green-400';
      if (m.classification === 'mistake') colorClass = 'text-yellow-400';
      if (m.classification === 'blunder') colorClass = 'text-red-400';
      
      let altMove = '';
      if (m.alternative) {
        altMove = `<span class="text-blue-400 text-xs ml-1">(try ${m.alternative.from}-${m.alternative.to})</span>`;
      }
      
      const checkMark = m.inCheck ? ' #' : '';
      const moveDisplay = `${m.moveNumber}${m.color === 'white' ? '.' : '...'} ${m.move}${checkMark}`;
      
      return `<div class="flex justify-between ${colorClass}">
        <span>${moveDisplay}${altMove}</span>
        <span>${m.evaluation > 0 ? '+' : ''}${m.evaluation.toFixed(1)}</span>
      </div>`;
    }).join('');
    
    drawEvalChart(analysis.evaluationHistory);
    
    document.getElementById('analysisLoading').classList.add('hidden');
    document.getElementById('analysisContent').classList.remove('hidden');
    
  } catch (error) {
    console.error('Analysis failed:', error);
    document.getElementById('analysisLoading').classList.add('hidden');
    document.getElementById('analysisContent').classList.remove('hidden');
    document.getElementById('moveAnalysisList').innerHTML = '<p class="text-red-400">Analysis failed. Please try again.</p>';
  }
}

function drawEvalChart(evalHistory) {
  const canvas = document.getElementById('evalChart');
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, width, height);
  
  if (!evalHistory || evalHistory.length === 0) return;
  
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  
  const maxEval = Math.max(...evalHistory.map(e => Math.abs(e.evaluation)), 5);
  
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  evalHistory.forEach((point, i) => {
    const x = (i / (evalHistory.length - 1)) * width;
    const y = height / 2 - (point.evaluation / maxEval) * (height / 2 - 10);
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  
  ctx.stroke();
  
  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px sans-serif';
  ctx.fillText('White advantage', 5, 12);
  ctx.fillText('Black advantage', 5, height - 5);
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    
    document.getElementById('totalGames').textContent = stats.total;
    document.getElementById('totalWins').textContent = stats.wins;
    document.getElementById('totalLosses').textContent = stats.losses;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

const personalityAvatars = {
  sassy: '😏',
  grandma: '👵',
  commentator: '🎙️',
  trashTalker: '🗣️',
  confused: '🤔'
};

const originalChangePersonality = changePersonality;
changePersonality = async function(personality) {
  await originalChangePersonality(personality);
  opponentAvatar.textContent = personalityAvatars[personality] || '♟️';
};

function updateCapturedPieces() {
  const pieceOrder = ['q', 'r', 'b', 'n', 'p'];
  
  capturedWhiteEl.innerHTML = capturedWhite
    .sort((a, b) => pieceOrder.indexOf(a) - pieceOrder.indexOf(b))
    .map(p => `<span class="captured-piece white">${getPieceChar(p)}</span>`)
    .join('');
  
  capturedBlackEl.innerHTML = capturedBlack
    .sort((a, b) => pieceOrder.indexOf(a) - pieceOrder.indexOf(b))
    .map(p => `<span class="captured-piece black">${getPieceChar(p)}</span>`)
    .join('');
  
  updateMaterialAdvantage();
}

function getPieceChar(type) {
  const chars = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' };
  return chars[type] || type;
}

function getPieceName(type) {
  const names = { p: 'queen', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' };
  return names[type] || type;
}

const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function updateMaterialAdvantage() {
  const whiteValue = capturedBlack.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const blackValue = capturedWhite.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const diff = whiteValue - blackValue;
  
  if (diff > 0) {
    materialAdvantageEl.innerHTML = `<span class="text-green-400">+${diff}</span>`;
  } else if (diff < 0) {
    materialAdvantageEl.innerHTML = `<span class="text-red-400">${diff}</span>`;
  } else {
    materialAdvantageEl.innerHTML = `<span class="even">=</span>`;
  }
}

function addCapturedPiece(piece) {
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();
  
  if (isWhite) {
    capturedBlack.push(type);
  } else {
    capturedWhite.push(type);
  }
  
  updateCapturedPieces();
}

const originalResetGame = resetGame;
resetGame = async function() {
  capturedWhite = [];
  capturedBlack = [];
  updateCapturedPieces();
  return originalResetGame();
};

document.getElementById('soundEffectsAlt').addEventListener('change', (e) => {
  soundEffectsCheckbox.checked = e.target.checked;
});

document.getElementById('explainMovesAlt').addEventListener('change', (e) => {
  explainMovesCheckbox.checked = e.target.checked;
});

opponentAvatar.textContent = personalityAvatars[personalitySelect.value] || '♟️';

loadStats();
fetchGameState();
