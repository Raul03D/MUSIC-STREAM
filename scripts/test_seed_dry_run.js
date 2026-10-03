require('dotenv').config();

const GENRE_CONFIGS = [
  {
    genre: 'Hindi',
    country: 'in',
    terms: [
      'hindi hits', 'arijit singh hindi', 'shreya ghoshal hindi', 'bollywood romance hindi',
      'hindi top 50', 'kumar sanu', 'alka yagnik', 'kishore kumar', 'lata mangeshkar',
      'sonu nigam', 'pritam', 'mohit chauhan', 'armaan malik', 'jubin nautiyal',
      'atif aslam hindi', 'sachin jigar', 'vishal mishra', 'hindi acoustic', 'desi melodies'
    ]
  },
  {
    genre: 'Bengali',
    country: 'in',
    terms: [
      'bengali songs', 'bangla hits', 'anupam roy', 'rabindra sangeet', 'somlata acharyya',
      'rupam islam', 'fossils bangla', 'nachiketa', 'shreya ghoshal bengali', 'arijit singh bengali',
      'hemanta mukherjee bengali', 'manna dey bengali', 'bhoomi bangla', 'cactus bangla',
      'chandrabindoo', 'jeebon mukhi gaan', 'bengali modern', 'monomoy bhattacharya'
    ]
  },
  {
    genre: 'English',
    country: 'us',
    terms: [
      'billboard hot 100', 'top hits english', 'ed sheeran', 'taylor swift', 'dua lipa',
      'adele', 'coldplay', 'imagine dragons', 'post malone', 'bruno mars',
      'maroon 5', 'the weeknd', 'harry styles', 'charlie puth', 'shawn mendes',
      'sam smith', 'halsey', 'lewis capaldi', 'one direction', 'john legend'
    ]
  },
  {
    genre: 'Bollywood',
    country: 'in',
    terms: [
      'bollywood dance party', 'bollywood item songs', 'badshah', 'ranveer singh songs',
      'shah rukh khan hits', 'salman khan hits', 'yo yo honey singh', 'mika singh',
      'neha kakkar hits', 'vishal shekhar', 'sunidhi chauhan', 'dharma productions',
      'yrf hits', 'amit trivedi', 'shankar ehsaan loy', 'karan johar bollywood',
      'housefull bollywood', 'dabangg bollywood', 'bollywood bhangra'
    ]
  },
  {
    genre: 'Pop',
    country: 'us',
    terms: [
      'pop chartbusters', 'ariana grande', 'katy perry', 'rihanna', 'billie eilish',
      'lady gaga', 'olivia rodrigo', 'selena gomez', 'justin bieber', 'shakira pop',
      'camila cabello', 'sabrina carpenter', 'chappell roan', 'miley cyrus', 'sia',
      'beyonce', 'demi lovato', 'charli xcx', 'kesha', 'bebe rexha'
    ]
  },
  {
    genre: 'Lo-Fi',
    country: 'us',
    terms: [
      'lofi chill beats', 'lo-fi study', 'chillhop', 'lofi hip hop', 'sleep lofi',
      'lofi rain', 'lofi cafe', 'relaxing lofi', 'lofi instrumental', 'cozy lofi',
      'midnight lofi', 'chill lofi piano', 'lofi beats to study to', 'lofi aesthetic',
      'lofi guitar', 'lofi anime', 'lofi jazz', 'lofi sunset', 'lofi nostalgia'
    ]
  },
  {
    genre: 'Synthwave',
    country: 'us',
    terms: [
      'synthwave', 'retrowave', 'outrun electro', 'kavinsky', 'the midnight synth',
      'gunship', 'carpenter brut', 'timecop1983', 'fm-84', 'dynatron',
      'mitch murder', 'scandroid', 'dance with the dead', 'waveshaper', 'miami nights 1984',
      'trevor something', 'lazerhawk', 'com truse', 'droid bishop'
    ]
  },
  {
    genre: 'Electronic',
    country: 'us',
    terms: [
      'electronic dance music', 'edm festival', 'avicii', 'martin garrix', 'david guetta',
      'tiesto', 'skrillex', 'kygo', 'alesso', 'calvin harris',
      'marshmello', 'the chainsmokers', 'deadmau5', 'hardwell', 'alan walker',
      'steve aoki', 'zedd', 'afrojack', 'dj snake', 'flume'
    ]
  }
];

async function dryRun() {
  console.log("Starting dry run testing for all 8 categories...");
  const globalSeenKeys = new Set();
  const globalSeenUris = new Set();
  const results = {};

  for (const config of GENRE_CONFIGS) {
    const list = [];
    console.log(`\nFetching for category: ${config.genre}...`);

    for (const term of config.terms) {
      if (list.length >= 100) break;
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song${config.country ? '&country=' + config.country : ''}&limit=100`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        for (const item of (data.results || [])) {
          if (!item.previewUrl || !item.trackName) continue;
          
          const cleanTitle = item.trackName.trim();
          const cleanArtist = (item.artistName || 'Artist').trim();
          const key = `${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}||${cleanArtist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          
          if (globalSeenKeys.has(key) || globalSeenUris.has(item.previewUrl)) {
            continue;
          }

          globalSeenKeys.add(key);
          globalSeenUris.add(item.previewUrl);

          list.push({
            title: cleanTitle,
            artist: cleanArtist,
            album: item.collectionName || `${cleanTitle} - EP`,
            uri: item.previewUrl,
            coverImage: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
            duration: Math.round((item.trackTimeMillis || 180000) / 1000),
            genre: config.genre
          });

          if (list.length >= 100) break;
        }
      } catch (err) {
        console.warn(`Fetch error for "${term}":`, err.message);
      }
    }

    results[config.genre] = list;
    console.log(`=> ${config.genre}: Collected ${list.length} distinct tracks!`);
  }

  console.log("\n================ DRY RUN SUMMARY ================");
  let allTotal = 0;
  for (const [genre, tracks] of Object.entries(results)) {
    console.log(`${genre.padEnd(12)}: ${tracks.length} songs`);
    allTotal += tracks.length;
  }
  console.log(`TOTAL UNIQUE SONGS: ${allTotal}`);
  console.log(`TOTAL GLOBAL KEYS IN SET: ${globalSeenKeys.size}`);
  console.log("================================================");
}

dryRun().catch(console.error);
