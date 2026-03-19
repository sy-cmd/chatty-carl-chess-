const https = require('https');

class PuzzleService {
  constructor() {
    this.baseUrl = 'lichess.org';
    this.themes = [
      'mate',
      'mateIn1',
      'mateIn2',
      'endgame',
      'tactics',
      'sacrifice',
      'deflection',
      'pinning',
      'discovery',
      'doubleAttack',
      'zugzwang',
      'advantage',
      'equality',
      'complex'
    ];
  }

  async fetchPuzzle(theme = null) {
    const url = theme 
      ? `/api/puzzle/next?themes=${theme}`
      : '/api/puzzle/next';
    
    return this.makeRequest(url);
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: path,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Lichess API error: ${res.statusCode}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }

  getThemes() {
    return this.themes;
  }

  getThemeDescription(theme) {
    const descriptions = {
      'mate': 'Checkmate patterns',
      'mateIn1': 'Mate in 1',
      'mateIn2': 'Mate in 2',
      'endgame': 'Endgame technique',
      'tactics': 'Tactical combinations',
      'sacrifice': 'Piece sacrifices',
      'deflection': 'Deflection tactics',
      'pinning': 'Pinning strategies',
      'discovery': 'Discovered attacks',
      'doubleAttack': 'Double attacks',
      'zugzwang': 'Zugzwang positions',
      'advantage': 'Winning advantage',
      'equality': 'Equalizing moves',
      'complex': 'Complex positions'
    };
    return descriptions[theme] || theme;
  }
}

module.exports = new PuzzleService();
