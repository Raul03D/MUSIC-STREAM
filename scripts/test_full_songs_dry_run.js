const crypto = require("crypto");

function decryptMediaUrl(encrypted) {
  if (!encrypted) return null;
  try {
    const key = Buffer.from("38346591", "utf-8");
    const decipher = crypto.createDecipheriv("des-ecb", key, "");
    let decrypted = decipher.update(encrypted, "base64", "utf-8");
    decrypted += decipher.final("utf-8");
    // _160.mp4 is 160kbps high quality full audio
    return decrypted.replace("_96.mp4", "_160.mp4");
  } catch (e) {
    return null;
  }
}

function cleanTitle(raw) {
  if (!raw) return "";
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\s*\(From "[^"]*"\)/gi, "")
    .replace(/\s*\(Original Motion Picture Track\)/gi, "")
    .trim();
}

function makeTrackKey(title, artist) {
  const t = (title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const a = (artist || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${t}||${a}`;
}

const GENRE_CONFIGS = [
  {
    genre: "Hindi",
    terms: [
      "hindi romantic hits", "arijit singh hindi", "hindi chartbusters", "shreya ghoshal hindi",
      "kumar sanu romantic", "kishore kumar evergreen", "lata mangeshkar hindi", "sonu nigam hits",
      "atif aslam hindi", "jubin nautiyal hindi", "alka yagnik hindi", "armaan malik hindi",
      "pritam romantic hindi", "sachin jigar hindi", "vishal mishra", "mohit chauhan hindi",
      "hindi acoustic songs", "desi romantic hits"
    ]
  },
  {
    genre: "Bengali",
    terms: [
      "bengali modern hits", "anupam roy bangla", "rabindra sangeet soulful", "somlata acharyya",
      "rupam islam bangla", "fossils bangla rock", "nachiketa bangla", "bengali film songs hits",
      "shreya ghoshal bengali", "arijit singh bengali", "hemanta mukherjee", "manna dey bengali",
      "chandrabindoo", "cactus bangla", "bhoomi bangla", "monomoy bhattacharya",
      "jeebon mukhi gaan", "bangla acoustic"
    ]
  },
  {
    genre: "English",
    terms: [
      "english pop hits", "billboard hot 100", "ed sheeran hits", "taylor swift songs",
      "the weeknd english", "dua lipa hits", "imagine dragons songs", "coldplay hits",
      "maroon 5 songs", "bruno mars hits", "post malone hits", "adele songs",
      "harry styles hits", "charlie puth songs", "shawn mendes hits", "sam smith english",
      "halsey hits", "one direction hits"
    ]
  },
  {
    genre: "Bollywood",
    terms: [
      "bollywood dance party", "bollywood blockbuster hits", "badshah party hits",
      "yo yo honey singh bollywood", "mika singh dance", "neha kakkar dance hits",
      "ranveer singh bollywood", "shah rukh khan hits", "salman khan dance hits",
      "sunidhi chauhan dance", "vishal shekhar bollywood", "amit trivedi bollywood",
      "shankar ehsaan loy bollywood", "dharma productions party", "yrf dance hits"
    ]
  },
  {
    genre: "Pop",
    terms: [
      "top pop hits", "ariana grande pop", "katy perry pop hits", "rihanna pop hits",
      "billie eilish pop", "lady gaga pop", "olivia rodrigo pop", "selena gomez pop",
      "justin bieber pop hits", "camila cabello pop", "sabrina carpenter pop",
      "miley cyrus pop", "shakira pop hits", "chappell roan", "sia pop hits",
      "charlie xcx pop", "demi lovato pop"
    ]
  },
  {
    genre: "Lo-Fi",
    terms: [
      "lofi chill", "lofi beats", "lofi hip hop", "chillhop beats", "lofi study",
      "lofi relax", "lofi sleep", "lofi rain", "lofi coffee", "lofi aesthetic",
      "lofi guitar", "lofi piano", "lofi ambient beats", "cozy lofi", "midnight lofi beats",
      "lofi sunset", "peaceful lofi"
    ]
  },
  {
    genre: "Synthwave",
    terms: [
      "synthwave", "retrowave", "outrun synthwave", "kavinsky", "the midnight synth",
      "gunship synthwave", "carpenter brut", "timecop1983", "80s synthwave", "retro electro",
      "cyberpunk synthwave", "neon synthwave", "fm-84", "dynatron", "mitch murder",
      "scandroid", "waveshaper"
    ]
  },
  {
    genre: "Electronic",
    terms: [
      "electronic dance music", "edm festival hits", "avicii edm", "martin garrix edm",
      "david guetta dance", "tiesto edm", "alan walker edm", "calvin harris dance",
      "marshmello edm", "the chainsmokers edm", "skrillex electronic", "kygo tropical edm",
      "alesso dance", "zedd electronic", "deadmau5 electronic", "hardwell festival"
    ]
  }
];

async function dryRunFullSongs() {
  console.log("Testing collection of 100 FULL-LENGTH songs for each of the 8 categories...");
  const globalSeenKeys = new Set();
  const globalSeenUris = new Set();
  const results = {};

  for (const config of GENRE_CONFIGS) {
    const list = [];
    console.log(`\nGathering full-length songs for: ${config.genre}...`);

    for (const term of config.terms) {
      if (list.length >= 100) break;
      const url =
        "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&n=50&q=" +
        encodeURIComponent(term);

      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const data = await res.json();
        for (const item of (data.results || [])) {
          if (!item.encrypted_media_url) continue;

          const title = cleanTitle(item.song || item.title);
          const artistName = (item.primary_artists || item.singers || "Artist").trim();
          const key = makeTrackKey(title, artistName);

          if (!title || globalSeenKeys.has(key)) continue;

          const fullAudioUrl = decryptMediaUrl(item.encrypted_media_url);
          if (!fullAudioUrl || globalSeenUris.has(fullAudioUrl)) continue;

          const durationNum = parseInt(item.duration, 10) || 180;
          // Ensure it's a full song, not a short teaser (at least 60 seconds)
          if (durationNum < 60) continue;

          globalSeenKeys.add(key);
          globalSeenUris.add(fullAudioUrl);

          const artwork = (item.image || "")
            .replace("150x150.jpg", "500x500.jpg")
            .replace("50x50.jpg", "500x500.jpg");

          list.push({
            title,
            artist: artistName,
            album: cleanTitle(item.album) || `${title} - Single`,
            uri: fullAudioUrl,
            coverImage: artwork || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
            duration: durationNum,
            genre: config.genre
          });

          if (list.length >= 100) break;
        }
      } catch (err) {
        console.warn(`Query "${term}" error:`, err.message);
      }
    }

    results[config.genre] = list;
    const avgDuration = Math.round(list.reduce((acc, t) => acc + t.duration, 0) / (list.length || 1));
    const mins = Math.floor(avgDuration / 60);
    const secs = avgDuration % 60;
    console.log(`=> ${config.genre}: Collected ${list.length} FULL songs! Average duration: ${mins}m ${secs}s`);
  }

  console.log("\n================ SUMMARY ================");
  let grandTotal = 0;
  for (const [genre, tracks] of Object.entries(results)) {
    console.log(`${genre.padEnd(12)}: ${tracks.length} full songs`);
    grandTotal += tracks.length;
  }
  console.log(`TOTAL UNIQUE FULL SONGS: ${grandTotal}`);
  console.log(`TOTAL GLOBAL KEYS IN SET: ${globalSeenKeys.size}`);
  console.log("=========================================");
}

dryRunFullSongs().catch(console.error);
