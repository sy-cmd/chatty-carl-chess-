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

module.exports = {
  initDatabase,
  saveGame,
  getGames,
  getGame,
  deleteGame,
  getStats
};
