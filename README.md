 
# Chatty Carl Chess

A full-stack AI-powered chess platform featuring a Stockfish engine opponent, real-time LLM commentary, voice synthesis, game analysis, and a complete GitOps deployment pipeline on Kubernetes.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Docker](https://img.shields.io/badge/Docker-DockerHub-blue)
![K3s](https://img.shields.io/badge/Deployed-K3s%20%2B%20ArgoCD-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Overview

This project has two layers:

**The App** — a feature-rich chess platform integrating multiple AI providers: Stockfish for engine play and analysis, Groq (LLaMA 3.1) for live personality-driven commentary, and OpenAI TTS for voice synthesis. Game history, move accuracy, and blunder detection are persisted to SQLite.

**The Pipeline** — a production-style GitOps workflow. GitHub Actions builds and pushes a Docker image to DockerHub on every commit. ArgoCD watches a dedicated manifest repo and automatically reconciles the deployment on a homelab K3s cluster — fully declarative, pull-based, zero manual deploys.

---

## Architecture

```
Code Push
    │
    ▼
GitHub Actions (ubuntu-latest)
    │  builds Docker image
    ▼
DockerHub
    │  image: <username>/chess-app:<sha>
    ▼
chess-app-k8s repo (manifest updated)
    │
    ▼
ArgoCD (watching manifest repo)
    │  auto-sync + self-heal
    ▼
K3s Homelab Cluster
    └── chess-app namespace
```

---

## Features

### Gameplay
-  AI Mode — play against Stockfish with skill levels 0–20
-  PvP Mode — local two-player
-  Legal move highlighting and validation
- ↩ Undo move
-  Hint system (Stockfish-powered)
-  Game reset and board flip
-  Promotion dialog

### AI & Engine
-  Stockfish integration with configurable skill levels
-  LLM commentary via Groq (llama-3.1-8b-instant) — "Chatty Carl"
-  5 AI personalities (see below)
-  Real-time evaluation bar
-  Mistake and blunder detection

### Voice & Sound
-  OpenAI TTS + Web Speech API for spoken commentary
-  Spoken move notation (announce moves)
-  Sound effects — moves, captures, check, game over

### UI & Themes
-  5 board themes — Classic, Blue, Wood, Purple, Dark
-  Timer with time controls — 5 min, 10 min, Blitz
-  Material advantage display
-  Move history
-  Check indicator

### Game Analysis & Data
-  Move accuracy scoring
-  PGN-style per-move analysis
-  Game history saved to SQLite
-  Win/loss statistics

---

## Personalities

| Personality | Style |
|-------------|-------|
| Sassy Sarah | Sarcastic and condescending |
| Grandma Gladys | Sweet and overly supportive |
| Commentator Carl | Dramatic sports announcer |
| Trash Talker Tony | Overconfident and cocky |
| Confused Carl | Baffled by every move |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express |
| Frontend | HTML, Vanilla JavaScript, Tailwind CSS |
| Chess Logic | chess.js |
| Engine | Stockfish (node-uci) |
| LLM Commentary | Groq API (llama-3.1-8b-instant) |
| Voice | OpenAI TTS + Web Speech API |
| Database | SQLite |
| Containerisation | Docker |
| CI/CD | GitHub Actions |
| GitOps | ArgoCD |
| Orchestration | K3s (Kubernetes) |

---

## Getting Started

### Prerequisites

- Node.js v18+
- Stockfish chess engine installed
- Groq API key — free at [console.groq.com](https://console.groq.com)
- OpenAI API key — for TTS voice synthesis

### Run Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/chatty-carl-chess
cd chatty-carl-chess

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your API keys to .env
```

```env
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run with Docker

```bash
docker pull <your-dockerhub-username>/chess-app:latest

docker run -p 3000:3000 \
  -e GROQ_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  <your-dockerhub-username>/chess-app:latest
```

---

## GitOps Deployment

This app is deployed using a pull-based GitOps pipeline. The deployment manifests live in a separate repo: [Curly-deployment](https://github.com/sy-cmd/homelab/blob/main/GitOps/ArgoCd/projects/carly-deployment/charty-carl.yaml)

### How it works

1. Push to `main` triggers GitHub Actions
2. GitHub Actions builds and pushes a new Docker image tagged with the commit SHA
3. The manifest repo is updated with the new image tag
4. ArgoCD detects the change and syncs the deployment to the K3s cluster automatically

### Apply to your own cluster

```bash
# Prerequisites: ArgoCD installed on your cluster
kubectl apply -f https://raw.githubusercontent.com/<your-username>/chess-app-k8s/main/argocd/application.yaml
```

---

## Project Structure

```
chatty-carl-chess/
├── server.js                  # Express server & API endpoints
├── dockerfile                 # Container definition
├── src/
│   ├── gameLogic.js           # Chess game logic wrapper
│   ├── stockfishPlayer.js     # Stockfish engine interface
│   ├── llmPlayer.js           # Groq API integration
│   └── prompts.js             # AI personality definitions
├── public/
│   ├── index.html             # Main HTML
│   ├── script.js              # Frontend JavaScript
│   ├── style.css              # Styling & themes
│   └── pieces/                # SVG chess pieces
├── .github/
│   └── workflows/
│       └── docker-build-push.yml  # CI pipeline
├── documentation.md           # Full technical docs
└── package.json
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/state` | GET | Get current game state |
| `/api/move` | POST | Make a move |
| `/api/evaluate` | POST | Get position evaluation |
| `/api/undo` | POST | Undo last move |
| `/api/hint` | POST | Get a move suggestion |
| `/api/reset` | POST | Start a new game |
| `/api/personality` | POST | Change AI personality |
| `/api/personalities` | GET | List all personalities |

---

## Acknowledgments

- Chess pieces from [cm-chessboard](https://github.com/shaack/cm-chessboard)
- [Stockfish](https://stockfishchess.org/) chess engine
- [Groq](https://groq.com) for LLM inference
- [OpenAI](https://openai.com) for TTS

---

## License

MIT — feel free to use for your own portfolio.
