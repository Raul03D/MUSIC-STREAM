require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../src/models/user.model");
const Music = require("../src/models/music.model");
const Album = require("../src/models/album.model");

function decryptMediaUrl(encrypted) {
  if (!encrypted) return null;
  try {
    const key = Buffer.from("38346591", "utf-8");
    const decipher = crypto.createDecipheriv("des-ecb", key, "");
    let decrypted = decipher.update(encrypted, "base64", "utf-8");
    decrypted += decipher.final("utf-8");
    // Return high quality 160kbps full stream
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
    albums: [
      {
        title: "Bollywood Romantics & Soul",
        desc: "Full-length soulful romantic Hindi ballads and timeless heart warmers.",
        cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Desi Chartbusters",
        desc: "The hottest trending full Hindi hits dominating the music charts.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Hindi Melodies & Acoustic",
        desc: "Acoustic guitar melodies, unplugged Hindi gems, and pure vocals.",
        cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Golden Era Hindi Classics",
        desc: "Timeless Hindi evergreen melodies and nostalgic orchestral classics.",
        cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80"
      }
    ],
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
    albums: [
      {
        title: "Kolkata Chronicles & Modern Bangla",
        desc: "Contemporary Bengali melodies, poetic expressions, and modern Kolkata vibes.",
        cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Soulful Rabindra Sangeet",
        desc: "Timeless Tagore classics rendered in sublime acoustic arrangements.",
        cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Bangla Rock & Alternative",
        desc: "Electrifying guitar riffs and anthems from legendary Bengali bands.",
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Romantic Bengali Duets",
        desc: "Lush vocal harmonies and romantic Bangla film soundtracks.",
        cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
      }
    ],
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
    albums: [
      {
        title: "Billboard Global Hits",
        desc: "The world's highest charting full English singles and global radio favorites.",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Midnight Drive & Indie Anthems",
        desc: "Moody late-night alternative pop and indie anthems.",
        cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Pop Superstars & Chart Toppers",
        desc: "Massive international pop sensations and stadium-sized choruses.",
        cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Acoustic & Melodic English",
        desc: "Raw vocals, piano chords, and acoustic songwriting at its finest.",
        cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
      }
    ],
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
    albums: [
      {
        title: "Bollywood Dance Party Anthems",
        desc: "High voltage dance floor smash hits from the biggest Bollywood movies.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Cinematic Bollywood Bangers",
        desc: "Blockbuster cinematic music featuring pounding drums and energetic brass.",
        cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Desi Beats & High Energy",
        desc: "Punjabi-infused Bollywood rhythms and party anthems.",
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Bollywood Blockbuster Melodies",
        desc: "Iconic cinematic moments and unforgettable movie title tracks.",
        cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
      }
    ],
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
    albums: [
      {
        title: "Pop Culture Explosion",
        desc: "Infectious hooks, pristine production, and modern global pop anthems.",
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Pure Pop Energy & Hits",
        desc: "Upbeat dance-pop perfection designed to lift your spirits.",
        cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Modern Pop Essentials",
        desc: "The essential modern pop tracks defining today's streaming culture.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Acoustic Pop Sessions",
        desc: "Intimate pop ballads and acoustic reinterpretations of favorite songs.",
        cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
      }
    ],
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
    albums: [
      {
        title: "Midnight Lo-Fi Coffee",
        desc: "Warm vinyl crackles, mellow jazz chords, and cozy late night beats.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Study & Chill Beats",
        desc: "Relaxing background beats engineered for focus, coding, and reading.",
        cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Rainy Window Lo-Fi",
        desc: "Melancholic piano chords and soft drums for rainy afternoons.",
        cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Dreamy Bedroom Vibes",
        desc: "Nostalgic tape hiss, slow grooves, and serene lo-fi chillhop.",
        cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80"
      }
    ],
    terms: [
      "lofi chill", "lofi beats", "lofi hip hop", "chillhop beats", "lofi study",
      "lofi relax", "lofi sleep", "lofi rain", "lofi coffee", "lofi aesthetic",
      "lofi guitar", "lofi piano", "lofi ambient beats", "cozy lofi", "midnight lofi beats",
      "lofi sunset", "peaceful lofi"
    ]
  },
  {
    genre: "Synthwave",
    albums: [
      {
        title: "Neon Highway 1984",
        desc: "High-speed synth arpeggios, analog synthesizers, and retro futurism.",
        cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Retro Cyber City",
        desc: "Atmospheric neon dreams inspired by classic 80s sci-fi cinema.",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Synthwave Odyssey",
        desc: "Driving basslines, gated snares, and sweeping vintage synth pads.",
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Midnight Outrun",
        desc: "Cruising down coastal highways under neon skies at 200 MPH.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
      }
    ],
    terms: [
      "synthwave", "retrowave", "outrun synthwave", "kavinsky", "the midnight synth",
      "gunship synthwave", "carpenter brut", "timecop1983", "80s synthwave", "retro electro",
      "cyberpunk synthwave", "neon synthwave", "fm-84", "dynatron", "mitch murder",
      "scandroid", "waveshaper"
    ]
  },
  {
    genre: "Electronic",
    albums: [
      {
        title: "EDM Festival Euphoria",
        desc: "Massive festival drops, melodic builds, and stadium electronic energy.",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Club Electric 2026",
        desc: "Pulsing club anthems, underground tech house, and driving basslines.",
        cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Deep Bass & Electro House",
        desc: "Heavy synth leads, bass-heavy drops, and razor-sharp electronic rhythms.",
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Future Beats & Dance",
        desc: "Modern dance floor bangers, tropical melodies, and vocal electronic jams.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
      }
    ],
    terms: [
      "electronic dance music", "edm festival hits", "avicii edm", "martin garrix edm",
      "david guetta dance", "tiesto edm", "alan walker edm", "calvin harris dance",
      "marshmello edm", "the chainsmokers edm", "skrillex electronic", "kygo tropical edm",
      "alesso dance", "zedd electronic", "deadmau5 electronic", "hardwell festival"
    ]
  }
];

const artistCache = new Map();
let defaultPasswordHash = null;

async function getOrCreateArtistUser(artistName) {
  const trimmed = (artistName || "Groovify Artist").trim();
  const cacheKey = trimmed.toLowerCase();
  if (artistCache.has(cacheKey)) {
    return artistCache.get(cacheKey);
  }

  let artist = await User.findOne({
    username: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
  });

  if (!artist) {
    if (!defaultPasswordHash) {
      defaultPasswordHash = await bcrypt.hash("groovify2026!", 10);
    }
    const cleanEmail =
      trimmed.toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Math.floor(Math.random() * 10000) + "@groovify.io";
    artist = await User.create({
      username: trimmed,
      email: cleanEmail,
      password: defaultPasswordHash,
      role: "artist",
    });
  }

  artistCache.set(cacheKey, artist);
  return artist;
}

async function seedFullLengthSongs() {
  console.log("====================================================");
  console.log("Seeding 800 FULL LENGTH Songs (100 Per Genre) - Full Duration & Time");
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully!");

  console.log("\nPurging previous preview tracks & albums for clean full-length library...");
  await Music.deleteMany({});
  await Album.deleteMany({});
  console.log("Cleared old records.");

  const globalSeenKeys = new Set();
  const globalSeenUris = new Set();
  const finalSummary = {};

  for (const config of GENRE_CONFIGS) {
    console.log(`\n----------------------------------------------------`);
    console.log(`[GENRE] Gathering 100 FULL-LENGTH UNIQUE songs for: ${config.genre}...`);
    const categoryTracks = [];

    for (const term of config.terms) {
      if (categoryTracks.length >= 100) break;
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

          const duration = parseInt(item.duration, 10) || 180;
          // Must be full song (at least 60 seconds)
          if (duration < 60) continue;

          globalSeenKeys.add(key);
          globalSeenUris.add(fullAudioUrl);

          const artwork = (item.image || "")
            .replace("150x150.jpg", "500x500.jpg")
            .replace("50x50.jpg", "500x500.jpg");

          categoryTracks.push({
            title,
            artistName,
            albumTitle: cleanTitle(item.album) || `${title} - Album`,
            uri: fullAudioUrl,
            coverImage:
              artwork ||
              "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
            duration,
            genre: config.genre,
            plays: Math.floor(Math.random() * 850000) + 25000,
          });

          if (categoryTracks.length >= 100) break;
        }
      } catch (err) {
        console.warn(`Query "${term}" fetch error:`, err.message);
      }
    }

    console.log(`=> Found ${categoryTracks.length} strictly unique FULL songs for "${config.genre}". Saving to database...`);

    // Create 4 themed albums for this genre
    const albumDocs = [];
    const genreLeadArtist = await getOrCreateArtistUser(`${config.genre} Curations`);
    for (const albumMeta of config.albums) {
      const alb = await Album.create({
        title: albumMeta.title,
        description: albumMeta.desc,
        genre: config.genre,
        coverImage: albumMeta.cover,
        releaseYear: 2026,
        artist: genreLeadArtist._id,
        musics: [],
      });
      albumDocs.push(alb);
    }

    // Insert music tracks
    const insertedTrackIds = [];
    for (let i = 0; i < categoryTracks.length; i++) {
      const t = categoryTracks[i];
      const artistUser = await getOrCreateArtistUser(t.artistName);
      const assignedAlbum = albumDocs[i % albumDocs.length];

      const musicDoc = await Music.create({
        title: t.title,
        artist: artistUser._id,
        album: assignedAlbum._id,
        uri: t.uri,
        coverImage: t.coverImage,
        duration: t.duration,
        genre: config.genre,
        plays: t.plays,
        likes: [],
      });

      insertedTrackIds.push(musicDoc._id);
      assignedAlbum.musics.push(musicDoc._id);
    }

    // Update album tracklists
    for (const alb of albumDocs) {
      await Album.findByIdAndUpdate(alb._id, { musics: alb.musics });
    }

    const avgDuration = Math.round(categoryTracks.reduce((acc, t) => acc + t.duration, 0) / categoryTracks.length);
    const m = Math.floor(avgDuration / 60);
    const s = avgDuration % 60;
    finalSummary[config.genre] = {
      count: insertedTrackIds.length,
      avgDuration: `${m}m ${s}s`,
    };

    console.log(
      `[SUCCESS] Saved ${insertedTrackIds.length} full songs for ${config.genre} (Average Duration: ${m}m ${s}s)`
    );
  }

  console.log("\n====================================================");
  console.log("FINAL FULL-LENGTH SEEDING VERIFICATION:");
  let totalCount = 0;
  for (const [genre, info] of Object.entries(finalSummary)) {
    console.log(`- ${genre.padEnd(14)}: ${info.count} full songs (Avg Time: ${info.avgDuration})`);
    totalCount += info.count;
  }
  console.log(`----------------------------------------------------`);
  console.log(`Total Unique Full Songs Seeded: ${totalCount}`);
  console.log(`Total Distinct Global Keys: ${globalSeenKeys.size}`);
  console.log("====================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. Full songs seeding complete!");
  process.exit(0);
}

seedFullLengthSongs().catch((err) => {
  console.error("Fatal error seeding full songs:", err);
  process.exit(1);
});
