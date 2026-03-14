const https = require('https');

let lichessToken = null;

function setToken(token) {
  lichessToken = token;
}

const ECO_OPENINGS = {
  'A00': { name: 'King\'s Pawn Game', eco: 'A00' },
  'A01': { name: 'Nimzowitsch Defense', eco: 'A01' },
  'A02': { name: 'Bird\'s Opening', eco: 'A02' },
  'A03': { name: 'Bird\'s Opening', eco: 'A03' },
  'A04': { name: 'Van\'t Kruijs Opening', eco: 'A04' },
  'A05': { name: 'Indian Game', eco: 'A05' },
  'A06': { name: 'English Opening', eco: 'A06' },
  'A07': { name: 'King\'s Indian Attack', eco: 'A07' },
  'A08': { name: 'King\'s Indian Attack', eco: 'A08' },
  'A09': { name: 'Reverse Sicilian', eco: 'A09' },
  'A10': { name: 'English Opening', eco: 'A10' },
  'A11': { name: 'English, Carlsbad System', eco: 'A11' },
  'A12': { name: 'English, Torre Attack', eco: 'A12' },
  'A13': { name: 'English, Neo-Catalan', eco: 'A13' },
  'A14': { name: 'English, Neo-Catalan', eco: 'A14' },
  'A15': { name: 'English, Anglo-Indian Defense', eco: 'A15' },
  'A16': { name: 'English, Anglo-Indian Defense', eco: 'A16' },
  'A17': { name: 'English, Anglo-Indian Defense', eco: 'A17' },
  'A18': { name: 'English, Mikenas Defense', eco: 'A18' },
  'A19': { name: 'English, Mikenas Defense', eco: 'A19' },
  'A20': { name: 'English Opening', eco: 'A20' },
  'A21': { name: 'English, Reversed Sicilian', eco: 'A21' },
  'A22': { name: 'English, Reversed Sicilian', eco: 'A22' },
  'A23': { name: 'English, Bremen System', eco: 'A23' },
  'A24': { name: 'English, Bremen System', eco: 'A24' },
  'A25': { name: 'English, Closed System', eco: 'A25' },
  'A26': { name: 'English, Closed System', eco: 'A26' },
  'A27': { name: 'English, Three Knights System', eco: 'A27' },
  'A28': { name: 'English, Four Knights System', eco: 'A28' },
  'A29': { name: 'English, Four Knights System', eco: 'A29' },
  'A30': { name: 'English, Symmetrical', eco: 'A30' },
  'A31': { name: 'English, Symmetrical', eco: 'A31' },
  'A32': { name: 'English, Symmetrical', eco: 'A32' },
  'A33': { name: 'English, Symmetrical', eco: 'A33' },
  'A34': { name: 'English, Symmetrical', eco: 'A34' },
  'A35': { name: 'English, Symmetrical', eco: 'A35' },
  'A36': { name: 'English, Symmetrical', eco: 'A36' },
  'A37': { name: 'English, Symmetrical', eco: 'A37' },
  'A38': { name: 'English, Symmetrical', eco: 'A38' },
  'A39': { name: 'English, Symmetrical', eco: 'A39' },
  'A40': { name: 'Queen\'s Pawn Opening', eco: 'A40' },
  'A41': { name: 'Queen\'s Pawn Opening', eco: 'A41' },
  'A42': { name: 'Modern Defense', eco: 'A42' },
  'A43': { name: 'Old Indian Defense', eco: 'A43' },
  'A44': { name: 'Old Indian Defense', eco: 'A44' },
  'A45': { name: 'Queen\'s Pawn Game', eco: 'A45' },
  'A46': { name: 'Queen\'s Pawn Game', eco: 'A46' },
  'A47': { name: 'Queen\'s Indian Defense', eco: 'A47' },
  'A48': { name: 'King\'s Indian Defense', eco: 'A48' },
  'A49': { name: 'King\'s Indian Defense', eco: 'A49' },
  'A50': { name: 'Queen\'s Indian Defense', eco: 'A50' },
  'A51': { name: 'Budapest Defense', eco: 'A51' },
  'A52': { name: 'Budapest Defense', eco: 'A52' },
  'A53': { name: 'Old Indian Defense', eco: 'A53' },
  'A54': { name: 'Old Indian Defense', eco: 'A54' },
  'A55': { name: 'Old Indian Defense', eco: 'A55' },
  'A56': { name: 'Benoni Defense', eco: 'A56' },
  'A57': { name: 'Benko Gambit', eco: 'A57' },
  'A58': { name: 'Benko Gambit', eco: 'A58' },
  'A59': { name: 'Benko Gambit', eco: 'A59' },
  'A60': { name: 'Benoni Defense', eco: 'A60' },
  'A61': { name: 'Benoni Defense', eco: 'A61' },
  'A62': { name: 'Benoni Defense', eco: 'A62' },
  'A63': { name: 'Benoni Defense', eco: 'A63' },
  'A64': { name: 'Benoni Defense', eco: 'A64' },
  'A65': { name: 'Benoni Defense', eco: 'A65' },
  'A66': { name: 'Benoni Defense', eco: 'A66' },
  'A67': { name: 'Benoni Defense', eco: 'A67' },
  'A68': { name: 'Benoni Defense', eco: 'A68' },
  'A69': { name: 'Benoni Defense', eco: 'A69' },
  'A70': { name: 'Benoni Defense', eco: 'A70' },
  'A71': { name: 'Benoni Defense', eco: 'A71' },
  'A72': { name: 'Benoni Defense', eco: 'A72' },
  'A73': { name: 'Benoni Defense', eco: 'A73' },
  'A74': { name: 'Benoni Defense', eco: 'A74' },
  'A75': { name: 'Benoni Defense', eco: 'A75' },
  'A76': { name: 'Benoni Defense', eco: 'A76' },
  'A77': { name: 'Benoni Defense', eco: 'A77' },
  'A78': { name: 'Benoni Defense', eco: 'A78' },
  'A79': { name: 'Benoni Defense', eco: 'A79' },
  'A80': { name: 'Dutch Defense', eco: 'A80' },
  'A81': { name: 'Dutch Defense', eco: 'A81' },
  'A82': { name: 'Dutch Defense', eco: 'A82' },
  'A83': { name: 'Dutch Defense', eco: 'A83' },
  'A84': { name: 'Dutch Defense', eco: 'A84' },
  'A85': { name: 'Dutch Defense', eco: 'A85' },
  'A86': { name: 'Dutch Defense', eco: 'A86' },
  'A87': { name: 'Dutch Defense', eco: 'A87' },
  'A88': { name: 'Dutch Defense', eco: 'A88' },
  'A89': { name: 'Dutch Defense', eco: 'A89' },
  'A90': { name: 'Dutch Defense', eco: 'A90' },
  'A91': { name: 'Dutch Defense', eco: 'A91' },
  'A92': { name: 'Dutch Defense', eco: 'A92' },
  'A93': { name: 'Dutch Defense', eco: 'A93' },
  'A94': { name: 'Dutch Defense', eco: 'A94' },
  'A95': { name: 'Dutch Defense', eco: 'A95' },
  'A96': { name: 'Dutch Defense', eco: 'A96' },
  'A97': { name: 'Dutch Defense', eco: 'A97' },
  'A98': { name: 'Dutch Defense', eco: 'A98' },
  'A99': { name: 'Dutch Defense', eco: 'A99' },
  
  'B00': { name: 'King\'s Pawn Opening', eco: 'B00' },
  'B01': { name: 'Scandinavian Defense', eco: 'B01' },
  'B02': { name: 'Alekhine\'s Defense', eco: 'B02' },
  'B03': { name: 'Alekhine\'s Defense', eco: 'B03' },
  'B04': { name: 'Alekhine\'s Defense', eco: 'B04' },
  'B05': { name: 'Alekhine\'s Defense', eco: 'B05' },
  'B06': { name: 'Pirc Defense', eco: 'B06' },
  'B07': { name: 'Pirc Defense', eco: 'B07' },
  'B08': { name: 'Pirc Defense', eco: 'B08' },
  'B09': { name: 'Pirc Defense', eco: 'B09' },
  'B10': { name: ' Caro-Kann Defense', eco: 'B10' },
  'B11': { name: 'Caro-Kann Defense', eco: 'B11' },
  'B12': { name: 'Caro-Kann Defense', eco: 'B12' },
  'B13': { name: 'Caro-Kann Defense', eco: 'B13' },
  'B14': { name: 'Caro-Kann Defense', eco: 'B14' },
  'B15': { name: 'Caro-Kann Defense', eco: 'B15' },
  'B16': { name: 'Caro-Kann Defense', eco: 'B16' },
  'B17': { name: 'Caro-Kann Defense', eco: 'B17' },
  'B18': { name: 'Caro-Kann Defense', eco: 'B18' },
  'B19': { name: 'Caro-Kann Defense', eco: 'B19' },
  'B20': { name: 'Sicilian Defense', eco: 'B20' },
  'B21': { name: 'Sicilian Defense', eco: 'B21' },
  'B22': { name: 'Sicilian Defense', eco: 'B22' },
  'B23': { name: 'Sicilian Defense', eco: 'B23' },
  'B24': { name: 'Sicilian Defense', eco: 'B24' },
  'B25': { name: 'Sicilian Defense', eco: 'B25' },
  'B26': { name: 'Sicilian Defense', eco: 'B26' },
  'B27': { name: 'Sicilian Defense', eco: 'B27' },
  'B28': { name: 'Sicilian Defense', eco: 'B28' },
  'B29': { name: 'Sicilian Defense', eco: 'B29' },
  'B30': { name: 'Sicilian Defense', eco: 'B30' },
  'B31': { name: 'Sicilian Defense', eco: 'B31' },
  'B32': { name: 'Sicilian Defense', eco: 'B32' },
  'B33': { name: 'Sicilian Defense', eco: 'B33' },
  'B34': { name: 'Sicilian Defense', eco: 'B34' },
  'B35': { name: 'Sicilian Defense', eco: 'B35' },
  'B36': { name: 'Sicilian Defense', eco: 'B36' },
  'B37': { name: 'Sicilian Defense', eco: 'B37' },
  'B38': { name: 'Sicilian Defense', eco: 'B38' },
  'B39': { name: 'Sicilian Defense', eco: 'B39' },
  'B40': { name: 'Sicilian Defense', eco: 'B40' },
  'B41': { name: 'Sicilian Defense', eco: 'B41' },
  'B42': { name: 'Sicilian Defense', eco: 'B42' },
  'B43': { name: 'Sicilian Defense', eco: 'B43' },
  'B44': { name: 'Sicilian Defense', eco: 'B44' },
  'B45': { name: 'Sicilian Defense', eco: 'B45' },
  'B46': { name: 'Sicilian Defense', eco: 'B46' },
  'B47': { name: 'Sicilian Defense', eco: 'B47' },
  'B48': { name: 'Sicilian Defense', eco: 'B48' },
  'B49': { name: 'Sicilian Defense', eco: 'B49' },
  'B50': { name: 'Sicilian Defense', eco: 'B50' },
  'B51': { name: 'Sicilian Defense', eco: 'B51' },
  'B52': { name: 'Sicilian Defense', eco: 'B52' },
  'B53': { name: 'Sicilian Defense', eco: 'B53' },
  'B54': { name: 'Sicilian Defense', eco: 'B54' },
  'B55': { name: 'Sicilian Defense', eco: 'B55' },
  'B56': { name: 'Sicilian Defense', eco: 'B56' },
  'B57': { name: 'Sicilian Defense', eco: 'B57' },
  'B58': { name: 'Sicilian Defense', eco: 'B58' },
  'B59': { name: 'Sicilian Defense', eco: 'B59' },
  'B60': { name: 'Sicilian Defense', eco: 'B60' },
  'B61': { name: 'Sicilian Defense', eco: 'B61' },
  'B62': { name: 'Sicilian Defense', eco: 'B62' },
  'B63': { name: 'Sicilian Defense', eco: 'B63' },
  'B64': { name: 'Sicilian Defense', eco: 'B64' },
  'B65': { name: 'Sicilian Defense', eco: 'B65' },
  'B66': { name: 'Sicilian Defense', eco: 'B66' },
  'B67': { name: 'Sicilian Defense', eco: 'B67' },
  'B68': { name: 'Sicilian Defense', eco: 'B68' },
  'B69': { name: 'Sicilian Defense', eco: 'B69' },
  'B70': { name: 'Sicilian Defense', eco: 'B70' },
  'B71': { name: 'Sicilian Defense', eco: 'B71' },
  'B72': { name: 'Sicilian Defense', eco: 'B72' },
  'B73': { name: 'Sicilian Defense', eco: 'B73' },
  'B74': { name: 'Sicilian Defense', eco: 'B74' },
  'B75': { name: 'Sicilian Defense', eco: 'B75' },
  'B76': { name: 'Sicilian Defense', eco: 'B76' },
  'B77': { name: 'Sicilian Defense', eco: 'B77' },
  'B78': { name: 'Sicilian Defense', eco: 'B78' },
  'B79': { name: 'Sicilian Defense', eco: 'B79' },
  'B80': { name: 'Sicilian Defense', eco: 'B80' },
  'B81': { name: 'Sicilian Defense', eco: 'B81' },
  'B82': { name: 'Sicilian Defense', eco: 'B82' },
  'B83': { name: 'Sicilian Defense', eco: 'B83' },
  'B84': { name: 'Sicilian Defense', eco: 'B84' },
  'B85': { name: 'Sicilian Defense', eco: 'B85' },
  'B86': { name: 'Sicilian Defense', eco: 'B86' },
  'B87': { name: 'Sicilian Defense', eco: 'B87' },
  'B88': { name: 'Sicilian Defense', eco: 'B88' },
  'B89': { name: 'Sicilian Defense', eco: 'B89' },
  'B90': { name: 'Sicilian Defense', eco: 'B90' },
  'B91': { name: 'Sicilian Defense', eco: 'B91' },
  'B92': { name: 'Sicilian Defense', eco: 'B92' },
  'B93': { name: 'Sicilian Defense', eco: 'B93' },
  'B94': { name: 'Sicilian Defense', eco: 'B94' },
  'B95': { name: 'Sicilian Defense', eco: 'B95' },
  'B96': { name: 'Sicilian Defense', eco: 'B96' },
  'B97': { name: 'Sicilian Defense', eco: 'B97' },
  'B98': { name: 'Sicilian Defense', eco: 'B98' },
  'B99': { name: 'Sicilian Defense', eco: 'B99' },
  
  'C00': { name: 'French Defense', eco: 'C00' },
  'C01': { name: 'French Exchange', eco: 'C01' },
  'C02': { name: 'French Advance', eco: 'C02' },
  'C03': { name: 'French Tarrasch', eco: 'C03' },
  'C04': { name: 'French Tarrasch', eco: 'C04' },
  'C05': { name: 'French Tarrasch', eco: 'C05' },
  'C06': { name: 'French Tarrasch', eco: 'C06' },
  'C07': { name: 'French, Tarrasch', eco: 'C07' },
  'C08': { name: 'French, Tarrasch', eco: 'C08' },
  'C09': { name: 'French, Tarrasch', eco: 'C09' },
  'C10': { name: 'French Defense', eco: 'C10' },
  'C11': { name: 'French Defense', eco: 'C11' },
  'C12': { name: 'French Defense', eco: 'C12' },
  'C13': { name: 'French Defense', eco: 'C13' },
  'C14': { name: 'French Defense', eco: 'C14' },
  'C15': { name: 'French Defense', eco: 'C15' },
  'C16': { name: 'French Defense', eco: 'C16' },
  'C17': { name: 'French Defense', eco: 'C17' },
  'C18': { name: 'French Defense', eco: 'C18' },
  'C19': { name: 'French Defense', eco: 'C19' },
  'C20': { name: 'Center Game', eco: 'C20' },
  'C21': { name: 'Center Game', eco: 'C21' },
  'C22': { name: 'Center Game', eco: 'C22' },
  'C23': { name: 'Bishop\'s Opening', eco: 'C23' },
  'C24': { name: 'Bishop\'s Opening', eco: 'C24' },
  'C25': { name: 'Vienna Game', eco: 'C25' },
  'C26': { name: 'Vienna Game', eco: 'C26' },
  'C27': { name: 'Vienna Game', eco: 'C27' },
  'C28': { name: 'Vienna Game', eco: 'C28' },
  'C29': { name: 'Vienna Gambit', eco: 'C29' },
  'C30': { name: 'King\'s Gambit', eco: 'C30' },
  'C31': { name: 'King\'s Gambit', eco: 'C31' },
  'C32': { name: 'King\'s Gambit', eco: 'C32' },
  'C33': { name: 'King\'s Gambit', eco: 'C33' },
  'C34': { name: 'King\'s Gambit', eco: 'C34' },
  'C35': { name: 'King\'s Gambit', eco: 'C35' },
  'C36': { name: 'King\'s Gambit', eco: 'C36' },
  'C37': { name: 'King\'s Gambit', eco: 'C37' },
  'C38': { name: 'King\'s Gambit', eco: 'C38' },
  'C39': { name: 'King\'s Gambit', eco: 'C39' },
  'C40': { name: 'King\'s Knight Opening', eco: 'C40' },
  'C41': { name: 'Philidor Defense', eco: 'C41' },
  'C42': { name: 'Petrov Defense', eco: 'C42' },
  'C43': { name: 'Petrov Defense', eco: 'C43' },
  'C44': { name: 'Ponziani Opening', eco: 'C44' },
  'C45': { name: 'Scottish Game', eco: 'C45' },
  'C46': { name: 'Three Knights Game', eco: 'C46' },
  'C47': { name: 'Four Knights Game', eco: 'C47' },
  'C48': { name: 'Four Knights Game', eco: 'C48' },
  'C49': { name: 'Four Knights Game', eco: 'C49' },
  'C50': { name: 'Giuoco Piano', eco: 'C50' },
  'C51': { name: 'Evans Gambit', eco: 'C51' },
  'C52': { name: 'Evans Gambit', eco: 'C52' },
  'C53': { name: 'Giuoco Piano', eco: 'C53' },
  'C54': { name: 'Giuoco Piano', eco: 'C54' },
  'C55': { name: 'Two Knights Defense', eco: 'C55' },
  'C56': { name: 'Two Knights Defense', eco: 'C56' },
  'C57': { name: 'Two Knights Defense', eco: 'C57' },
  'C58': { name: 'Two Knights Defense', eco: 'C58' },
  'C59': { name: 'Two Knights Defense', eco: 'C59' },
  'C60': { name: 'Ruy Lopez', eco: 'C60' },
  'C61': { name: 'Ruy Lopez', eco: 'C61' },
  'C62': { name: 'Ruy Lopez', eco: 'C62' },
  'C63': { name: 'Ruy Lopez', eco: 'C63' },
  'C64': { name: 'Ruy Lopez', eco: 'C64' },
  'C65': { name: 'Ruy Lopez', eco: 'C65' },
  'C66': { name: 'Ruy Lopez', eco: 'C66' },
  'C67': { name: 'Ruy Lopez', eco: 'C67' },
  'C68': { name: 'Ruy Lopez', eco: 'C68' },
  'C69': { name: 'Ruy Lopez', eco: 'C69' },
  'C70': { name: 'Ruy Lopez', eco: 'C70' },
  'C71': { name: 'Ruy Lopez', eco: 'C71' },
  'C72': { name: 'Ruy Lopez', eco: 'C72' },
  'C73': { name: 'Ruy Lopez', eco: 'C73' },
  'C74': { name: 'Ruy Lopez', eco: 'C74' },
  'C75': { name: 'Ruy Lopez', eco: 'C75' },
  'C76': { name: 'Ruy Lopez', eco: 'C76' },
  'C77': { name: 'Ruy Lopez', eco: 'C77' },
  'C78': { name: 'Ruy Lopez', eco: 'C78' },
  'C79': { name: 'Ruy Lopez', eco: 'C79' },
  'C80': { name: 'Ruy Lopez', eco: 'C80' },
  'C81': { name: 'Ruy Lopez', eco: 'C81' },
  'C82': { name: 'Ruy Lopez', eco: 'C82' },
  'C83': { name: 'Ruy Lopez', eco: 'C83' },
  'C84': { name: 'Ruy Lopez', eco: 'C84' },
  'C85': { name: 'Ruy Lopez', eco: 'C85' },
  'C86': { name: 'Ruy Lopez', eco: 'C86' },
  'C87': { name: 'Ruy Lopez', eco: 'C87' },
  'C88': { name: 'Ruy Lopez', eco: 'C88' },
  'C89': { name: 'Ruy Lopez', eco: 'C89' },
  'C90': { name: 'Ruy Lopez', eco: 'C90' },
  'C91': { name: 'Ruy Lopez', eco: 'C91' },
  'C92': { name: 'Ruy Lopez', eco: 'C92' },
  'C93': { name: 'Ruy Lopez', eco: 'C93' },
  'C94': { name: 'Ruy Lopez', eco: 'C94' },
  'C95': { name: 'Ruy Lopez', eco: 'C95' },
  'C96': { name: 'Ruy Lopez', eco: 'C96' },
  'C97': { name: 'Ruy Lopez', eco: 'C97' },
  'C98': { name: 'Ruy Lopez', eco: 'C98' },
  'C99': { name: 'Ruy Lopez', eco: 'C99' },
  
  'D00': { name: 'Queen\'s Pawn Opening', eco: 'D00' },
  'D01': { name: 'Richter-Veresov Attack', eco: 'D01' },
  'D02': { name: 'Queen\'s Pawn Game', eco: 'D02' },
  'D03': { name: 'Queen\'s Pawn Game', eco: 'D03' },
  'D04': { name: 'Queen\'s Pawn Game', eco: 'D04' },
  'D05': { name: 'Queen\'s Pawn Game', eco: 'D05' },
  'D06': { name: 'Queen\'s Gambit', eco: 'D06' },
  'D07': { name: 'Queen\'s Gambit', eco: 'D07' },
  'D08': { name: 'Queen\'s Gambit', eco: 'D08' },
  'D09': { name: 'Queen\'s Gambit', eco: 'D09' },
  'D10': { name: 'Slav Defense', eco: 'D10' },
  'D11': { name: 'Slav Defense', eco: 'D11' },
  'D12': { name: 'Slav Defense', eco: 'D12' },
  'D13': { name: 'Slav Defense', eco: 'D13' },
  'D14': { name: 'Slav Defense', eco: 'D14' },
  'D15': { name: 'Slav Defense', eco: 'D15' },
  'D16': { name: 'Slav Defense', eco: 'D16' },
  'D17': { name: 'Slav Defense', eco: 'D17' },
  'D18': { name: 'Slav Defense', eco: 'D18' },
  'D19': { name: 'Slav Defense', eco: 'D19' },
  'D20': { name: 'Queen\'s Gambit Accepted', eco: 'D20' },
  'D21': { name: 'Queen\'s Gambit Accepted', eco: 'D21' },
  'D22': { name: 'Queen\'s Gambit Accepted', eco: 'D22' },
  'D23': { name: 'Queen\'s Gambit Accepted', eco: 'D23' },
  'D24': { name: 'Queen\'s Gambit Accepted', eco: 'D24' },
  'D25': { name: 'Queen\'s Gambit Accepted', eco: 'D25' },
  'D26': { name: 'Queen\'s Gambit Accepted', eco: 'D26' },
  'D27': { name: 'Queen\'s Gambit Accepted', eco: 'D27' },
  'D28': { name: 'Queen\'s Gambit Accepted', eco: 'D28' },
  'D29': { name: 'Queen\'s Gambit Accepted', eco: 'D29' },
  'D30': { name: 'Queen\'s Gambit Declined', eco: 'D30' },
  'D31': { name: 'Queen\'s Gambit Declined', eco: 'D31' },
  'D32': { name: 'Queen\'s Gambit Declined', eco: 'D32' },
  'D33': { name: 'Queen\'s Gambit Declined', eco: 'D33' },
  'D34': { name: 'Queen\'s Gambit Declined', eco: 'D34' },
  'D35': { name: 'Queen\'s Gambit Declined', eco: 'D35' },
  'D36': { name: 'Queen\'s Gambit Declined', eco: 'D36' },
  'D37': { name: 'Queen\'s Gambit Declined', eco: 'D37' },
  'D38': { name: 'Queen\'s Gambit Declined', eco: 'D38' },
  'D39': { name: 'Queen\'s Gambit Declined', eco: 'D39' },
  'D40': { name: 'Queen\'s Gambit Declined', eco: 'D40' },
  'D41': { name: 'Queen\'s Gambit Declined', eco: 'D41' },
  'D42': { name: 'Queen\'s Gambit Declined', eco: 'D42' },
  'D43': { name: 'Queen\'s Gambit Declined', eco: 'D43' },
  'D44': { name: 'Queen\'s Gambit Declined', eco: 'D44' },
  'D45': { name: 'Queen\'s Gambit Declined', eco: 'D45' },
  'D46': { name: 'Queen\'s Gambit Declined', eco: 'D46' },
  'D47': { name: 'Queen\'s Gambit Declined', eco: 'D47' },
  'D48': { name: 'Queen\'s Gambit Declined', eco: 'D48' },
  'D49': { name: 'Queen\'s Gambit Declined', eco: 'D49' },
  'D50': { name: 'Queen\'s Gambit Declined', eco: 'D50' },
  'D51': { name: 'Queen\'s Gambit Declined', eco: 'D51' },
  'D52': { name: 'Queen\'s Gambit Declined', eco: 'D52' },
  'D53': { name: 'Queen\'s Gambit Declined', eco: 'D53' },
  'D54': { name: 'Queen\'s Gambit Declined', eco: 'D54' },
  'D55': { name: 'Queen\'s Gambit Declined', eco: 'D55' },
  'D56': { name: 'Queen\'s Gambit Declined', eco: 'D56' },
  'D57': { name: 'Queen\'s Gambit Declined', eco: 'D57' },
  'D58': { name: 'Queen\'s Gambit Declined', eco: 'D58' },
  'D59': { name: 'Queen\'s Gambit Declined', eco: 'D59' },
  'D60': { name: 'Queen\'s Gambit Declined', eco: 'D60' },
  'D61': { name: 'Queen\'s Gambit Declined', eco: 'D61' },
  'D62': { name: 'Queen\'s Gambit Declined', eco: 'D62' },
  'D63': { name: 'Queen\'s Gambit Declined', eco: 'D63' },
  'D64': { name: 'Queen\'s Gambit Declined', eco: 'D64' },
  'D65': { name: 'Queen\'s Gambit Declined', eco: 'D65' },
  'D66': { name: 'Queen\'s Gambit Declined', eco: 'D66' },
  'D67': { name: 'Queen\'s Gambit Declined', eco: 'D67' },
  'D68': { name: 'Queen\'s Gambit Declined', eco: 'D68' },
  'D69': { name: 'Queen\'s Gambit Declined', eco: 'D69' },
  'D70': { name: 'Grünfeld Defense', eco: 'D70' },
  'D71': { name: 'Grünfeld Defense', eco: 'D71' },
  'D72': { name: 'Grünfeld Defense', eco: 'D72' },
  'D73': { name: 'Grünfeld Defense', eco: 'D73' },
  'D74': { name: 'Grünfeld Defense', eco: 'D74' },
  'D75': { name: 'Grünfeld Defense', eco: 'D75' },
  'D76': { name: 'Grünfeld Defense', eco: 'D76' },
  'D77': { name: 'Grünfeld Defense', eco: 'D77' },
  'D78': { name: 'Grünfeld Defense', eco: 'D78' },
  'D79': { name: 'Grünfeld Defense', eco: 'D79' },
  'D80': { name: 'Grünfeld Defense', eco: 'D80' },
  'D81': { name: 'Grünfeld Defense', eco: 'D81' },
  'D82': { name: 'Grünfeld Defense', eco: 'D82' },
  'D83': { name: 'Grünfeld Defense', eco: 'D83' },
  'D84': { name: 'Grünfeld Defense', eco: 'D84' },
  'D85': { name: 'Grünfeld Defense', eco: 'D85' },
  'D86': { name: 'Grünfeld Defense', eco: 'D86' },
  'D87': { name: 'Grünfeld Defense', eco: 'D87' },
  'D88': { name: 'Grünfeld Defense', eco: 'D88' },
  'D89': { name: 'Grünfeld Defense', eco: 'D89' },
  'D90': { name: 'Grünfeld Defense', eco: 'D90' },
  'D91': { name: 'Grünfeld Defense', eco: 'D91' },
  'D92': { name: 'Grünfeld Defense', eco: 'D92' },
  'D93': { name: 'Grünfeld Defense', eco: 'D93' },
  'D94': { name: 'Grünfeld Defense', eco: 'D94' },
  'D95': { name: 'Grünfeld Defense', eco: 'D95' },
  'D96': { name: 'Grünfeld Defense', eco: 'D96' },
  'D97': { name: 'Grünfeld Defense', eco: 'D97' },
  'D98': { name: 'Grünfeld Defense', eco: 'D98' },
  'D99': { name: 'Grünfeld Defense', eco: 'D99' },
  
  'E00': { name: 'Catalan Opening', eco: 'E00' },
  'E01': { name: 'Catalan Opening', eco: 'E01' },
  'E02': { name: 'Catalan Opening', eco: 'E02' },
  'E03': { name: 'Catalan Opening', eco: 'E03' },
  'E04': { name: 'Catalan Opening', eco: 'E04' },
  'E05': { name: 'Catalan Opening', eco: 'E05' },
  'E06': { name: 'Catalan Opening', eco: 'E06' },
  'E07': { name: 'Catalan Opening', eco: 'E07' },
  'E08': { name: 'Catalan Opening', eco: 'E08' },
  'E09': { name: 'Catalan Opening', eco: 'E09' },
  'E10': { name: 'Queen\'s Pawn Game', eco: 'E10' },
  'E11': { name: 'Queen\'s Indian Defense', eco: 'E11' },
  'E12': { name: 'Queen\'s Indian Defense', eco: 'E12' },
  'E13': { name: 'Queen\'s Indian Defense', eco: 'E13' },
  'E14': { name: 'Queen\'s Indian Defense', eco: 'E14' },
  'E15': { name: 'Queen\'s Indian Defense', eco: 'E15' },
  'E16': { name: 'Queen\'s Indian Defense', eco: 'E16' },
  'E17': { name: 'Queen\'s Indian Defense', eco: 'E17' },
  'E18': { name: 'Queen\'s Indian Defense', eco: 'E18' },
  'E19': { name: 'Queen\'s Indian Defense', eco: 'E19' },
  'E20': { name: 'Nimzo-Indian Defense', eco: 'E20' },
  'E21': { name: 'Nimzo-Indian Defense', eco: 'E21' },
  'E22': { name: 'Nimzo-Indian Defense', eco: 'E22' },
  'E23': { name: 'Nimzo-Indian Defense', eco: 'E23' },
  'E24': { name: 'Nimzo-Indian Defense', eco: 'E24' },
  'E25': { name: 'Nimzo-Indian Defense', eco: 'E25' },
  'E26': { name: 'Nimzo-Indian Defense', eco: 'E26' },
  'E27': { name: 'Nimzo-Indian Defense', eco: 'E27' },
  'E28': { name: 'Nimzo-Indian Defense', eco: 'E28' },
  'E29': { name: 'Nimzo-Indian Defense', eco: 'E29' },
  'E30': { name: 'Nimzo-Indian Defense', eco: 'E30' },
  'E31': { name: 'Nimzo-Indian Defense', eco: 'E31' },
  'E32': { name: 'Nimzo-Indian Defense', eco: 'E32' },
  'E33': { name: 'Nimzo-Indian Defense', eco: 'E33' },
  'E34': { name: 'Nimzo-Indian Defense', eco: 'E34' },
  'E35': { name: 'Nimzo-Indian Defense', eco: 'E35' },
  'E36': { name: 'Nimzo-Indian Defense', eco: 'E36' },
  'E37': { name: 'Nimzo-Indian Defense', eco: 'E37' },
  'E38': { name: 'Nimzo-Indian Defense', eco: 'E38' },
  'E39': { name: 'Nimzo-Indian Defense', eco: 'E39' },
  'E40': { name: 'Nimzo-Indian Defense', eco: 'E40' },
  'E41': { name: 'Nimzo-Indian Defense', eco: 'E41' },
  'E42': { name: 'Nimzo-Indian Defense', eco: 'E42' },
  'E43': { name: 'Nimzo-Indian Defense', eco: 'E43' },
  'E44': { name: 'Nimzo-Indian Defense', eco: 'E44' },
  'E45': { name: 'Nimzo-Indian Defense', eco: 'E45' },
  'E46': { name: 'Nimzo-Indian Defense', eco: 'E46' },
  'E47': { name: 'Nimzo-Indian Defense', eco: 'E47' },
  'E48': { name: 'Nimzo-Indian Defense', eco: 'E48' },
  'E49': { name: 'Nimzo-Indian Defense', eco: 'E49' },
  'E50': { name: 'Nimzo-Indian Defense', eco: 'E50' },
  'E51': { name: 'Nimzo-Indian Defense', eco: 'E51' },
  'E52': { name: 'Nimzo-Indian Defense', eco: 'E52' },
  'E53': { name: 'Nimzo-Indian Defense', eco: 'E53' },
  'E54': { name: 'Nimzo-Indian Defense', eco: 'E54' },
  'E55': { name: 'Nimzo-Indian Defense', eco: 'E55' },
  'E56': { name: 'Nimzo-Indian Defense', eco: 'E56' },
  'E57': { name: 'Nimzo-Indian Defense', eco: 'E57' },
  'E58': { name: 'Nimzo-Indian Defense', eco: 'E58' },
  'E59': { name: 'Nimzo-Indian Defense', eco: 'E59' },
  'E60': { name: 'King\'s Indian Defense', eco: 'E60' },
  'E61': { name: 'King\'s Indian Defense', eco: 'E61' },
  'E62': { name: 'King\'s Indian Defense', eco: 'E62' },
  'E63': { name: 'King\'s Indian Defense', eco: 'E63' },
  'E64': { name: 'King\'s Indian Defense', eco: 'E64' },
  'E65': { name: 'King\'s Indian Defense', eco: 'E65' },
  'E66': { name: 'King\'s Indian Defense', eco: 'E66' },
  'E67': { name: 'King\'s Indian Defense', eco: 'E67' },
  'E68': { name: 'King\'s Indian Defense', eco: 'E68' },
  'E69': { name: 'King\'s Indian Defense', eco: 'E69' },
  'E70': { name: 'King\'s Indian Defense', eco: 'E70' },
  'E71': { name: 'King\'s Indian Defense', eco: 'E71' },
  'E72': { name: 'King\'s Indian Defense', eco: 'E72' },
  'E73': { name: 'King\'s Indian Defense', eco: 'E73' },
  'E74': { name: 'King\'s Indian Defense', eco: 'E74' },
  'E75': { name: 'King\'s Indian Defense', eco: 'E75' },
  'E76': { name: 'King\'s Indian Defense', eco: 'E76' },
  'E77': { name: 'King\'s Indian Defense', eco: 'E77' },
  'E78': { name: 'King\'s Indian Defense', eco: 'E78' },
  'E79': { name: 'King\'s Indian Defense', eco: 'E79' },
  'E80': { name: 'King\'s Indian Defense', eco: 'E80' },
  'E81': { name: 'King\'s Indian Defense', eco: 'E81' },
  'E82': { name: 'King\'s Indian Defense', eco: 'E82' },
  'E83': { name: 'King\'s Indian Defense', eco: 'E83' },
  'E84': { name: 'King\'s Indian Defense', eco: 'E84' },
  'E85': { name: 'King\'s Indian Defense', eco: 'E85' },
  'E86': { name: 'King\'s Indian Defense', eco: 'E86' },
  'E87': { name: 'King\'s Indian Defense', eco: 'E87' },
  'E88': { name: 'King\'s Indian Defense', eco: 'E88' },
  'E89': { name: 'King\'s Indian Defense', eco: 'E89' },
  'E90': { name: 'King\'s Indian Defense', eco: 'E90' },
  'E91': { name: 'King\'s Indian Defense', eco: 'E91' },
  'E92': { name: 'King\'s Indian Defense', eco: 'E92' },
  'E93': { name: 'King\'s Indian Defense', eco: 'E93' },
  'E94': { name: 'King\'s Indian Defense', eco: 'E94' },
  'E95': { name: 'King\'s Indian Defense', eco: 'E95' },
  'E96': { name: 'King\'s Indian Defense', eco: 'E96' },
  'E97': { name: 'King\'s Indian Defense', eco: 'E97' },
  'E98': { name: 'King\'s Indian Defense', eco: 'E98' },
  'E99': { name: 'King\'s Indian Defense', eco: 'E99' }
};

const COMMON_OPENINGS = {
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': { name: 'Starting Position', eco: 'START' },
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1': { name: 'King\'s Pawn Opening', eco: 'A04' },
  'r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2': { name: 'Open Game', eco: 'B00' },
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1': { name: 'Queen\'s Pawn Opening', eco: 'D00' },
  'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2': { name: 'King\'s Knight Opening', eco: 'C40' },
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKBNR b KQkq - 1 2': { name: 'Giuoco Piano', eco: 'C50' },
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2': { name: 'Italian Game', eco: 'C50' },
  'r1bqkbnr/pppp1ppp/2n5/4p3/P7/5N2/1PPP1PPP/RNBQKBNR b KQkq - 0 3': { name: 'Giuoco Piano', eco: 'C54' },
  'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4': { name: 'Four Knights Game', eco: 'C47' },
  'r1bqk2r/pppp1ppp/2n2n2/2b1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4': { name: 'Four Knights Game', eco: 'C48' },
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2': { name: 'Sicilian Defense', eco: 'B20' },
  'rnbqkbnr/pppp1ppp/8/2b1p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2': { name: 'Bishop\'s Opening', eco: 'C23' },
  'rnbqkb1r/pppppppp/5n2/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2': { name: 'Old Indian Defense', eco: 'A53' },
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': { name: 'Standard Position', eco: 'A00' },
  'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 1 3': { name: 'Four Knights Game', eco: 'C47' },
  'rnbqkbnr/pp1ppppp/2p5/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2': { name: 'Symmetrical Defense', eco: 'D00' },
  'rnbqkbnr/pp1ppppp/2p5/8/3P4/5N2/PPP1PPPP/RNBQKB1R b KQkq - 1 2': { name: 'Old Indian Defense', eco: 'A54' },
  'r1bqk2r/pppp1ppp/2n1p3/2b1P3/5N2/2N5/PPPP1PPP/R1BQKB1R w KQkq - 0 5': { name: 'Two Knights Defense', eco: 'C55' },
  'r1bqkb1r/pppp1ppp/2n2n2/3qP3/5N2/2N5/PPPP1PPP/R1BQKB1R b KQkq - 0 5': { name: 'Max Lange Attack', eco: 'C55' },
  'r1b1kb1r/pppp1ppp/2n2n2/4p3/2q1P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 6': { name: 'Giuoco Pianissimo', eco: 'C50' },
  
  // More common openings
  'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4': { name: 'Ruy Lopez', eco: 'C60' },
  'r1bqkbnr/pppp1ppp/2n5/4p3/3bP3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 1 3': { name: 'Italian Game', eco: 'C50' },
  'rnbqkbnr/ppp1pppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2': { name: 'Scandinavian Defense', eco: 'B01' },
  'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2': { name: 'Caro-Kann Defense', eco: 'B10' },
  'r1bqkb1r/ppp1pppp/2p2n2/3p4/4P3/5N2/PPP1PPPP/RNBQKB1R w KQkq - 0 3': { name: 'Pirc Defense', eco: 'B07' },
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2': { name: 'King\'s Indian Defense', eco: 'E60' },
  'r1bqkb1r/pppp1ppp/2n2n2/3pP3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 3': { name: 'Nimzo-Indian Defense', eco: 'E20' },
  'rnbqkbnr/pp1ppppp/2p5/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1': { name: 'Slav Defense', eco: 'D10' },
  'rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq - 0 1': { name: 'King\'s Gambit', eco: 'C30' },
  'rnbqkb1r/pppppppp/5n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 2': { name: 'Old Indian Defense', eco: 'A53' },
  'rnbqkbnr/1ppppppp/8/p7/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2': { name: 'Benko Gambit', eco: 'A57' },
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq': { name: 'Starting Position', eco: 'START' },
  'rnbqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 1 3': { name: 'Four Knights Game', eco: 'C47' },
  'r1bqkbnr/ppp1pppp/2p5/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1': { name: 'Slav Defense', eco: 'D10' },
  'rnbqkb1r/ppp1pppp/2p2n2/3p4/4P3/5N2/PPP1PPPP/RNBQKB1R b KQkq - 0 3': { name: 'Pirc Defense', eco: 'B07' },
  'r1bqkbnr/pp1ppppp/2p5/8/3P4/2N5/PPP1PPPP/R1BQKBNR w KQkq - 1 2': { name: 'Old Indian Defense', eco: 'A54' },
  'r1bqk2r/pppp1ppp/2n2n2/3b4/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 1 4': { name: 'Giuoco Piano', eco: 'C50' },
  'r1bqkb1r/ppp1pppp/2n2n2/3p4/4P3/5N2/PPP1PPPP/RNBQKB1R w KQkq - 0 3': { name: 'King\'s Indian Defense', eco: 'E60' },
  'rnbqkb1r/pppppppp/5n2/8/3pP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 2': { name: 'Old Indian Defense', eco: 'A53' },
  'r1bqk2r/pppp1ppp/2n1pn2/3p4/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4': { name: 'Four Knights Game', eco: 'C47' },
  'r1bqkbnr/pppp1ppp/2n5/8/3bP3/5N2/PPP1PPPP/RNBQKB1R w KQkq - 1 3': { name: 'Italian Game', eco: 'C50' },
  'rnbqkbnr/1ppppppp/8/p7/3P4/2N5/PPP1PPPP/R1BQKBNR b KQkq - 0 2': { name: 'Benko Gambit', eco: 'A57' },
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 1 1': { name: 'King\'s Knight Opening', eco: 'C40' },
  'r1bqkb1r/pppp1ppp/2n2n2/3qP3/4P3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3': { name: 'Max Lange Attack', eco: 'C55' },
  'rnbqkb1r/ppp1pppp/2p2n2/3p4/4P3/5N2/PPP1PPPP/RNBQKB1R w KQkq - 0 3': { name: 'Pirc Defense', eco: 'B07' },
  'r1bqkb1r/pppppppp/2n2n2/3q4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2': { name: 'Scandinavian Defense', eco: 'B01' }
};

class OpeningExplorer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  async getOpeningData(fen) {
    const cacheKey = fen;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    let data;
    
    // Try Lichess API first if token is available
    if (lichessToken) {
      try {
        data = await this.fetchFromLichess(fen);
        if (data && data.moves && data.moves.length > 0) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      } catch (e) {
        console.log('Lichess API error, falling back to local database:', e.message);
      }
    }
    
    // Fall back to local database
    data = this.analyzePosition(fen);
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  async fetchFromLichess(fen) {
    return new Promise((resolve, reject) => {
      // Get just the board position (first 4 parts: position, turn, castling, en passant)
      const fenParts = fen.split(' ');
      const shortFen = fenParts.slice(0, 4).join(' ');
      
      const params = new URLSearchParams({
        fen: shortFen,
        variant: 'standard'
      });

      const options = {
        hostname: 'explorer.lichess.org',
        path: `/lichess?${params.toString()}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lichessToken}`,
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
              const parsed = JSON.parse(data);
              resolve(this.formatLichessData(parsed, fen));
            } else if (res.statusCode === 401 || res.statusCode === 403) {
              reject(new Error('Authentication failed'));
            } else {
              reject(new Error(`API error: ${res.statusCode}`));
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

  formatLichessData(data, fen) {
    // Handle new array format or old string format
    let movesArray = [];
    if (Array.isArray(data.moves)) {
      movesArray = data.moves;
    } else if (typeof data.moves === 'string') {
      movesArray = data.moves.split(' ');
    }
    
    const moveStats = [];
    
    for (const moveData of movesArray) {
      const move = moveData.uci || moveData;
      const white = moveData.white || 0;
      const draws = moveData.draws || 0;
      const black = moveData.black || 0;
      const total = white + draws + black;

      if (total > 0 && move) {
        moveStats.push({
          move: move,
          white: white,
          draws: draws,
          black: black,
          total: total,
          whitePercent: ((white / total) * 100).toFixed(1),
          drawPercent: ((draws / total) * 100).toFixed(1),
          blackPercent: ((black / total) * 100).toFixed(1)
        });
      }
    }

    const totalGames = (data.white || 0) + (data.draws || 0) + (data.black || 0);

    return {
      fen: fen,
      opening: data.opening || null,
      whiteGames: data.white || 0,
      blackGames: data.black || 0,
      drawGames: data.draws || 0,
      totalGames: totalGames,
      moves: moveStats.slice(0, 10),
      source: 'lichess'
    };
  }

  analyzePosition(fen) {
    // Extract only the board position (first part before the space)
    const board = fen.split(' ')[0];
    
    // Direct lookup first
    if (COMMON_OPENINGS[board]) {
      return this.formatOpeningData(COMMON_OPENINGS[board]);
    }
    
    // Also try full FEN
    if (COMMON_OPENINGS[fen]) {
      return this.formatOpeningData(COMMON_OPENINGS[fen]);
    }
    
    let eco = 'A00';
    let name = 'Unknown Position';
    
    // Pattern matching for common openings
    if (board === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR') {
      name = 'Starting Position';
      eco = 'START';
    } else if (board === 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR') {
      name = "King's Pawn Opening";
      eco = 'A04';
    } else if (board === 'rnbqkbnr/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R') {
      name = "King's Knight Opening";
      eco = 'C40';
    } else if (board === 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR') {
      name = "Queen's Pawn Opening";
      eco = 'D00';
    } else if (board === 'rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR') {
      name = "King's Gambit";
      eco = 'C30';
    } else if (board === 'rnbqkb1r/pppppppp/5n2/8/3PP3/8/PPP2PPP/RNBQKBNR') {
      name = 'Old Indian Defense';
      eco = 'A53';
    } else if (board === 'rnbqkb1r/pppppppp/5n2/8/3PP3/5N2/PPP2PPP/RNBQKB1R') {
      name = 'Old Indian Defense';
      eco = 'A54';
    } else if (board === 'r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR') {
      name = 'Open Game';
      eco = 'B00';
    } else if (board === 'rnbqkbnr/ppp1pppp/2p5/8/3P4/8/PPP1PPPP/RNBQKBNR') {
      name = 'Symmetrical Defense';
      eco = 'D00';
    } else if (board === 'rnbqkbnr/ppp1pppp/2p5/8/3P4/2N5/PPP1PPPP/R1BQKBNR') {
      name = 'Old Indian Defense';
      eco = 'A54';
    } else if (board.includes('pppp1ppp') && board.includes('/4p3/')) {
      // Sicilian patterns
      if (board.includes('rnbqkbnr/pppp1ppp')) {
        name = 'Sicilian Defense';
        eco = 'B20';
      } else if (board.includes('r1bqkb1r/pppp1ppp')) {
        name = 'Sicilian Defense';
        eco = 'B20';
      }
    } else if (board.includes('/4p3/') && board.includes('P3/')) {
      // Italian patterns
      if (board.includes('r1bqkbnr') && board.includes('nn')) {
        name = 'Giuoco Piano';
        eco = 'C50';
      }
    } else if (board.includes('rnbqkbnr/pppp1ppp') && board.includes('4p3')) {
      // Sicilian Defense - black pawn on e5, white on e4
      name = 'Sicilian Defense';
      eco = 'B20';
    } else if (board.includes('r1bqkb1r/pppp1ppp') && board.includes('4p3')) {
      name = 'Four Knights Game';
      eco = 'C47';
    } else if (board.includes('pppp1ppp') && board.includes('5n2')) {
      name = 'King\'s Fianchetto';
      eco = 'A04';
    } else if (board.includes('p5p1') || board.includes('p1p5')) {
      name = 'Pirc Defense';
      eco = 'B07';
    } else if (board.includes('/4p3/') && board.includes('/8/')) {
      // Check if it's a French-like position
      if (board.includes('pppp1ppp')) {
        name = 'French Defense';
        eco = 'C00';
      }
    } else if (board.includes('pppppppp') && board.includes('PPP')) {
      if (turn === 'w') {
        name = "King's Pawn Opening";
        eco = 'A04';
      } else {
        name = "Queen's Pawn Opening";
        eco = 'D00';
      }
    }
    
    return this.formatOpeningData({ name, eco });
  }

  formatOpeningData(opening) {
    // Use the provided name if available, otherwise look up from ECO
    const name = opening.name || (ECO_OPENINGS[opening.eco] ? ECO_OPENINGS[opening.eco].name : opening.eco);
    
    return {
      fen: '',
      opening: {
        name: name,
        eco: opening.eco
      },
      whiteGames: 0,
      blackGames: 0,
      drawGames: 0,
      totalGames: 0,
      moves: [],
      note: 'Basic opening information. Connect to Lichess API for detailed statistics.'
    };
  }

  getEmptyOpeningData() {
    return {
      fen: '',
      opening: null,
      whiteGames: 0,
      blackGames: 0,
      drawGames: 0,
      totalGames: 0,
      moves: []
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = {
  instance: new OpeningExplorer(),
  setToken: setToken
};
