# Chatty Carl Chess

A fun, interactive chess web application featuring an AI opponent with personality! Play against Stockfish-powered AI that provides hilarious commentary using Groq's LLM.

![Chess App](https://img.shields.io/badge/Node.js-18+-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- 🎮 **Play against AI** - Stockfish-powered chess engine
- 😂 **Funny Commentary** - AI opponent with 5 different personalities
- ⏱️ **Timer Support** - Blitz, Rapid, and Unlimited time controls
- 📊 **Evaluation Bar** - Real-time position analysis
- 🔊 **Voice Commentary** - Hear the AI's trash talk (Web Speech API)
- 💡 **Hint System** - Get move suggestions from Stockfish
- 🎨 **5 Board Themes** - Classic, Blue, Wood, Purple, Dark
- 🔄 **Undo Moves** - Take back your last move
- 🔊 **Sound Effects** - Move, capture, check, and game over sounds

## Personalities

| Personality | Description |
|-------------|-------------|
| Sassy Sarah | Sarcastic and condescending |
| Grandma Gladys | Sweet and overly supportive |
| Commentator Carl | Dramatic sports announcer |
| Trash Talker Tony | Overconfident and cocky |
| Confused Carl | Baffled by every move |

## Tech Stack

- **Backend**: Node.js, Express
- **Chess Logic**: chess.js
- **AI Engine**: Stockfish (via node-uci)
- **Commentary**: Groq LLM (llama-3.1-8b-instant)
- **Frontend**: HTML, Vanilla JavaScript, Tailwind CSS

## Getting Started

### Prerequisites

- Node.js v14+
- Stockfish chess engine
- Groq API key (free)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd chess-app

# Install dependencies
npm install

# Create .env file
echo "GROQ_API_KEY=your_api_key_here" > .env
echo "PORT=5000" >> .env
```

Get your free Groq API key at [console.groq.com](https://console.groq.com)

### Run Locally

```bash
npm start
```

Open [http://localhost:5000](http://localhost:5000) in your browser.



See [documentation.md](./documentation.md) for detailed deployment instructions.

## Project Structure

```
chess-app/
├── server.js           # Express server & API endpoints
├── src/
│   ├── gameLogic.js   # Chess game logic wrapper
│   ├── stockfishPlayer.js  # Stockfish engine interface
│   ├── llmPlayer.js   # Groq API integration
│   └── prompts.js     # AI personality definitions
├── public/
│   ├── index.html     # Main HTML page
│   ├── script.js      # Frontend JavaScript
│   ├── style.css     # Styling & themes
│   └── pieces/       # SVG chess pieces
├── documentation.md   # Full technical docs
├── README.md         # This file
└── package.json      # Dependencies
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/state` | GET | Get current game state |
| `/api/move` | POST | Make a move |
| `/api/evaluate` | POST | Get position evaluation |
| `/api/undo` | POST | Undo last move |
| `/api/hint` | POST | Get a hint |
| `/api/reset` | POST | Start new game |
| `/api/personality` | POST | Change AI personality |
| `/api/personalities` | GET | List all personalities |



## License

MIT License - feel free to use for your portfolio!

## Acknowledgments

- Chess pieces from [cm-chessboard](https://github.com/shaack/cm-chessboard)
- Stockfish chess engine
- Groq for LLM API
