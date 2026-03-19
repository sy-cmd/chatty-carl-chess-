const { Engine } = require('node-uci');

class StockfishPlayer {
  constructor(skillLevel = 10) {
    this.skillLevel = skillLevel;
    this.engine = null;
    this.isReady = false;
  }

  async init(stockfishPath = '/usr/games/stockfish') {
    try {
      this.engine = new Engine(stockfishPath);
      await this.engine.init();
      await this.engine.setoption('Skill Level', this.skillLevel);
      this.isReady = true;
      console.log(`Stockfish initialized with skill level: ${this.skillLevel}`);
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      throw error;
    }
  }

  async getBestMove(fen, timeoutMs = 15000) {
    if (!this.engine || !this.isReady) {
      throw new Error('Stockfish not initialized');
    }

    try {
      await this.engine.position(fen);
      
      // First try to find a forced mate
      let result = await Promise.race([
        this.engine.go({ depth: 1, mate: 1 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Stockfish timeout')), 3000))
      ]).catch(() => null);
      
      // If no mate found or timeout, use regular depth search with higher depth
      if (!result || !result.bestmove) {
        result = await Promise.race([
          this.engine.go({ depth: 20 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Stockfish timeout')), timeoutMs))
        ]);
      }
      
      return result.bestmove;
    } catch (error) {
      console.error('Stockfish getBestMove error:', error);
      throw error;
    }
  }

  async setDifficulty(level) {
    this.skillLevel = Math.max(0, Math.min(20, level));
    if (this.engine && this.isReady) {
      await this.engine.setoption('Skill Level', this.skillLevel);
      console.log(`Stockfish difficulty set to: ${this.skillLevel}`);
    }
  }

  async getEvaluation(fen, timeoutMs = 10000) {
    if (!this.engine || !this.isReady) {
      return 0;
    }

    try {
      await this.engine.position(fen);
      const result = await Promise.race([
        this.engine.go({ depth: 15 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Stockfish evaluation timeout')), timeoutMs))
      ]);
      
      if (result.info && Array.isArray(result.info)) {
        for (const info of result.info) {
          if (info.score && info.score.value !== undefined) {
            return info.score.value / 100;
          }
          if (info.score && info.score.mate !== undefined) {
            return info.score.mate > 0 ? 10 : -10;
          }
        }
      }
      return 0;
    } catch (error) {
      console.error('Stockfish evaluation error:', error);
      return 0;
    }
  }

  async quit() {
    if (this.engine) {
      try {
        await this.engine.quit();
      } catch (error) {
        console.error('Error quitting Stockfish:', error);
      }
      this.engine = null;
      this.isReady = false;
    }
  }
}

module.exports = StockfishPlayer;
