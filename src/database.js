const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'games.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      player_color TEXT,
      opponent TEXT,
      difficulty INTEGER,
      result TEXT,
      pgn TEXT,
      analysis TEXT,
      duration_seconds INTEGER
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS puzzle_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      puzzle_id TEXT,
      theme TEXT,
      rating INTEGER,
      result TEXT,
      time_taken_seconds INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  saveDatabase();
  console.log('Database initialized successfully');
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function saveGame(gameData) {
  const { playerColor, opponent, difficulty, result, pgn, analysis, durationSeconds } = gameData;
  
  db.run(
    `INSERT INTO games (player_color, opponent, difficulty, result, pgn, analysis, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [playerColor, opponent, difficulty, result, pgn, JSON.stringify(analysis), durationSeconds]
  );
  
  saveDatabase();
  
  const result2 = db.exec('SELECT last_insert_rowid() as id');
  return result2[0].values[0][0];
}

function getGames(limit = 20, offset = 0) {
  const stmt = db.prepare(`
    SELECT id, created_at, player_color, opponent, difficulty, result, duration_seconds
    FROM games
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  stmt.bind([limit, offset]);
  
  const games = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    games.push(row);
  }
  stmt.free();
  
  return games;
}

function getGame(id) {
  const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
  stmt.bind([id]);
  
  let game = null;
  if (stmt.step()) {
    game = stmt.getAsObject();
    if (game.analysis) {
      game.analysis = JSON.parse(game.analysis);
    }
  }
  stmt.free();
  
  return game;
}

function deleteGame(id) {
  db.run('DELETE FROM games WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

function getStats() {
  const totalResult = db.exec('SELECT COUNT(*) as total FROM games');
  const winsResult = db.exec("SELECT COUNT(*) as wins FROM games WHERE result = 'win'");
  const lossesResult = db.exec("SELECT COUNT(*) as losses FROM games WHERE result = 'loss'");
  const drawsResult = db.exec("SELECT COUNT(*) as draws FROM games WHERE result = 'draw'");
  const avgDurationResult = db.exec('SELECT AVG(duration_seconds) as avg_duration FROM games WHERE duration_seconds IS NOT NULL');
  
  return {
    total: totalResult[0]?.values[0][0] || 0,
    wins: winsResult[0]?.values[0][0] || 0,
    losses: lossesResult[0]?.values[0][0] || 0,
    draws: drawsResult[0]?.values[0][0] || 0,
    avgDuration: avgDurationResult[0]?.values[0][0] || 0
  };
}

function savePuzzleAttempt(attemptData) {
  const { puzzleId, theme, rating, result, timeTakenSeconds } = attemptData;
  
  db.run(
    `INSERT INTO puzzle_attempts (puzzle_id, theme, rating, result, time_taken_seconds)
     VALUES (?, ?, ?, ?, ?)`,
    [puzzleId, theme, rating, result, timeTakenSeconds]
  );
  
  saveDatabase();
  
  const result2 = db.exec('SELECT last_insert_rowid() as id');
  return result2[0].values[0][0];
}

function getPuzzleStats() {
  const totalResult = db.exec('SELECT COUNT(*) as total FROM puzzle_attempts');
  const correctResult = db.exec("SELECT COUNT(*) as correct FROM puzzle_attempts WHERE result = 'correct'");
  const incorrectResult = db.exec("SELECT COUNT(*) as incorrect FROM puzzle_attempts WHERE result = 'incorrect'");
  const avgTimeResult = db.exec('SELECT AVG(time_taken_seconds) as avg_time FROM puzzle_attempts WHERE time_taken_seconds IS NOT NULL');
  
  const total = totalResult[0]?.values[0][0] || 0;
  const correct = correctResult[0]?.values[0][0] || 0;
  
  return {
    total: total,
    correct: correct,
    incorrect: incorrectResult[0]?.values[0][0] || 0,
    accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) : 0,
    avgTime: avgTimeResult[0]?.values[0][0] || 0
  };
}

function getRecentPuzzleAttempts(limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM puzzle_attempts
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  stmt.bind([limit]);
  
  const attempts = [];
  while (stmt.step()) {
    attempts.push(stmt.getAsObject());
  }
  stmt.free();
  
  return attempts;
}

module.exports = {
  initDatabase,
  saveGame,
  getGames,
  getGame,
  deleteGame,
  getStats,
  savePuzzleAttempt,
  getPuzzleStats,
  getRecentPuzzleAttempts
};
