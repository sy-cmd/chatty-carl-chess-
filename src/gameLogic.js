const { Chess } = require('chess.js');

class GameLogic {
  constructor() {
    this.chess = new Chess();
    this.currentPersonality = 'sassy';
    this.stockfish = null;
    this.moveStack = [];
  }

  setStockfish(stockfishPlayer) {
    this.stockfish = stockfishPlayer;
  }

  getState() {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      gameOver: this.chess.isGameOver(),
      inCheck: this.chess.inCheck(),
      result: this.getResult(),
      history: this.chess.history({ verbose: true }),
      legalMoves: this.getLegalMoves()
    };
  }

  getLegalMoves(square = null) {
    return this.chess.moves({ square, verbose: true });
  }

  makeMove(from, to, promotion = 'q') {
    try {
      const move = this.chess.move({
        from,
        to,
        promotion
      });

      if (!move) {
        return { success: false, error: 'Illegal move' };
      }

      this.moveStack.push({ from, to, promotion });

      return {
        success: true,
        state: this.getState(),
        move: move
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  undoLastTwoMoves() {
    try {
      const history = this.chess.history({ verbose: true });
      
      if (history.length === 0) {
        return { success: false, error: 'No moves to undo' };
      }

      this.chess.undo();
      
      if (this.chess.turn() === 'b') {
        this.chess.undo();
      }

      return {
        success: true,
        state: this.getState()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getRandomMove() {
    const moves = this.chess.moves();
    if (moves.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  makeRandomMove() {
    const move = this.getRandomMove();
    if (!move) return { success: false };

    try {
      const result = this.chess.move(move);
      if (result) {
        return {
          success: true,
          state: this.getState(),
          move: result
        };
      }
    } catch (error) {
      console.error('Error making random move:', error);
    }
    
    return { success: false };
  }

  async makeStockfishMove() {
    if (!this.stockfish) {
      console.log('Stockfish not set, using random move');
      return this.makeRandomMove();
    }

    try {
      const fen = this.chess.fen();
      const bestMove = await this.stockfish.getBestMove(fen);
      
      if (!bestMove) {
        console.log('No move from Stockfish, using random');
        return this.makeRandomMove();
      }

      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      return this.makeMove(from, to);
    } catch (error) {
      console.error('Stockfish error:', error.message);
      return this.makeRandomMove();
    }
  }

  getResult() {
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
    }
    if (this.chess.isStalemate()) {
      return 'Draw by stalemate!';
    }
    if (this.chess.isThreefoldRepetition()) {
      return 'Draw by threefold repetition!';
    }
    if (this.chess.isInsufficientMaterial()) {
      return 'Draw by insufficient material!';
    }
    if (this.chess.isGameOver()) {
      return 'Game over!';
    }
    return null;
  }

  setPersonality(personality) {
    this.currentPersonality = personality;
  }

  getPersonality() {
    return this.currentPersonality;
  }

  reset() {
    this.chess.reset();
    return this.getState();
  }
}

module.exports = GameLogic;
