require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");
const Music = require("../src/models/music.model");
const Album = require("../src/models/album.model");

const GENRE_CONFIGS = [
  {
    genre: "Hindi",
    country: "in",
    albums: [
      {
        title: "Bollywood Romantics & Soul",
        desc: "Soulful romantic Hindi ballads and heartwarming chartbusters.",
        cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Desi Chartbusters",
        desc: "The hottest trending Hindi hits dominating the music charts.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Hindi Melodies & Acoustic",
        desc: "Gentle acoustic guitar melodies, unplugged Hindi gems, and pure vocals.",
        cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Golden Era Hindi Classics",
        desc: "Timeless Hindi evergreen melodies and nostalgic orchestral classics.",
        cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80"
      }
    ],
    terms: [
      "hindi hits", "arijit singh hindi", "shreya ghoshal hindi", "bollywood romance hindi",
      "hindi top 50", "kumar sanu", "alka yagnik", "kishore kumar", "lata mangeshkar",
      "sonu nigam", "pritam", "mohit chauhan", "armaan malik", "jubin nautiyal",
      "atif aslam hindi", "sachin jigar", "vishal mishra", "hindi acoustic", "desi melodies"
    ]
  },
  {
    genre: "Bengali",
    country: "in",
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
      "bengali songs", "bangla hits", "anupam roy", "rabindra sangeet", "somlata acharyya",
      "rupam islam", "fossils bangla", "nachiketa", "shreya ghoshal bengali", "arijit singh bengali",
      "hemanta mukherjee bengali", "manna dey bengali", "bhoomi bangla", "cactus bangla",
      "chandrabindoo", "jeebon mukhi gaan", "bengali modern", "monomoy bhattacharya"
    ]
  },
  {
    genre: "English",
    country: "us",
    albums: [
      {
        title: "Billboard Global Hits",
        desc: "The world's highest charting English singles and global radio favorites.",
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
      "billboard hot 100", "top hits english", "ed sheeran", "taylor swift", "dua lipa",
      "adele", "coldplay", "imagine dragons", "post malone", "bruno mars",
      "maroon 5", "the weeknd", "harry styles", "charlie puth", "shawn mendes",
      "sam smith", "halsey", "lewis capaldi", "one direction", "john legend"
    ]
  },
  {
    genre: "Bollywood",
    country: "in",
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
      "bollywood dance party", "bollywood item songs", "badshah", "ranveer singh songs",
      "shah rukh khan hits", "salman khan hits", "yo yo honey singh", "mika singh",
      "neha kakkar hits", "vishal shekhar", "sunidhi chauhan", "dharma productions",
      "yrf hits", "amit trivedi", "shankar ehsaan loy", "karan johar bollywood",
      "housefull bollywood", "dabangg bollywood", "bollywood bhangra"
    ]
  },
  {
    genre: "Pop",
    country: "us",
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
      "pop chartbusters", "ariana grande", "katy perry", "rihanna", "billie eilish",
      "lady gaga", "olivia rodrigo", "selena gomez", "justin bieber", "shakira pop",
      "camila cabello", "sabrina carpenter", "chappell roan", "miley cyrus", "sia",
      "beyonce", "demi lovato", "charli xcx", "kesha", "bebe rexha"
    ]
  },
  {
    genre: "Lo-Fi",
    country: "us",
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
      "lofi chill beats", "lo-fi study", "chillhop", "lofi hip hop", "sleep lofi",
      "lofi rain", "lofi cafe", "relaxing lofi", "lofi instrumental", "cozy lofi",
      "midnight lofi", "chill lofi piano", "lofi beats to study to", "lofi aesthetic",
      "lofi guitar", "lofi anime", "lofi jazz", "lofi sunset", "lofi nostalgia"
    ]
  },
  {
    genre: "Synthwave",
    country: "us",
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
      "synthwave", "retrowave", "outrun electro", "kavinsky", "the midnight synth",
      "gunship", "carpenter brut", "timecop1983", "fm-84", "dynatron",
      "mitch murder", "scandroid", "dance with the dead", "waveshaper", "miami nights 1984",
      "trevor something", "lazerhawk", "com truse", "droid bishop"
    ]
  },
  {
    genre: "Electronic",
    country: "us",
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
      "electronic dance music", "edm festival", "avicii", "martin garrix", "david guetta",
      "tiesto", "skrillex", "kygo", "alesso", "calvin harris",
      "marshmello", "the chainsmokers", "deadmau5", "hardwell", "alan walker",
      "steve aoki", "zedd", "afrojack", "dj snake", "flume"
    ]
  }
];

// Helper: Normalize key to strictly prevent duplicates
function makeTrackKey(title, artist) {
  const cleanTitle = (title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanArtist = (artist || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanTitle}||${cleanArtist}`;
}

// Artist cache to avoid redundant User queries
const artistCache = new Map();
let defaultPasswordHash = null;

async function getOrCreateArtistUser(artistName) {
  const trimmed = (artistName || "Groovify Artist").trim();
  if (artistCache.has(trimmed.toLowerCase())) {
    return artistCache.get(trimmed.toLowerCase());
  }

  let artist = await User.findOne({
    username: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
  });

  if (!artist) {
    if (!defaultPasswordHash) {
      defaultPasswordHash = await bcrypt.hash("groovify2026!", 10);
    }
    const cleanEmail = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Math.floor(Math.random() * 1000) + "@groovify.io";
    artist = await User.create({
      username: trimmed,
      email: cleanEmail,
      password: defaultPasswordHash,
      role: "artist",
    });
  }

  artistCache.set(trimmed.toLowerCase(), artist);
  return artist;
}

async function seedAllGenres() {
  console.log("====================================================");
  console.log("Starting 100 Songs Per Genre Seeding Process (Total 800 Unique Songs)");
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully!");

  // Clean previous music and album collections to ensure exact 100 songs per genre
  console.log("\nPurging previous tracks and albums for a clean, verified catalog...");
  await Music.deleteMany({});
  await Album.deleteMany({});
  console.log("Previous tracks and albums cleared.");

  const globalSeenKeys = new Set();
  const globalSeenUris = new Set();
  const finalSummary = {};

  for (const config of GENRE_CONFIGS) {
    console.log(`\n----------------------------------------------------`);
    console.log(`[GENRE] Gathering 100 UNIQUE tracks for: ${config.genre}...`);
    const categoryTracks = [];

    for (const term of config.terms) {
      if (categoryTracks.length >= 100) break;
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song${config.country ? "&country=" + config.country : ""}&limit=120`;
      
      try {
        const res = await fetch(url);
        const data = await res.json();
        for (const item of (data.results || [])) {
          if (!item.previewUrl || !item.trackName) continue;

          const title = item.trackName.trim();
          const artistName = (item.artistName || "Unknown Artist").trim();
          const key = makeTrackKey(title, artistName);

          // Strictly enforce: No duplicates within this genre OR across any other genre!
          if (globalSeenKeys.has(key) || globalSeenUris.has(item.previewUrl)) {
            continue;
          }

          globalSeenKeys.add(key);
          globalSeenUris.add(item.previewUrl);

          categoryTracks.push({
            title,
            artistName,
            uri: item.previewUrl,
            coverImage: (item.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
            duration: Math.round((item.trackTimeMillis || 180000) / 1000),
            genre: config.genre,
            plays: Math.floor(Math.random() * 850000) + 15000,
          });

          if (categoryTracks.length >= 100) break;
        }
      } catch (err) {
        console.warn(`Query "${term}" fetch error:`, err.message);
      }
    }

    console.log(`=> Found ${categoryTracks.length} strictly unique songs for "${config.genre}". Saving to database...`);

    // Create the 4 themed albums for this genre (25 songs per album)
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
        musics: []
      });
      albumDocs.push(alb);
    }

    // Insert music tracks and distribute into albums
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
        likes: []
      });

      insertedTrackIds.push(musicDoc._id);
      assignedAlbum.musics.push(musicDoc._id);
    }

    // Update album musics arrays
    for (const alb of albumDocs) {
      await Album.findByIdAndUpdate(alb._id, { musics: alb.musics });
    }

    finalSummary[config.genre] = insertedTrackIds.length;
    console.log(`[SUCCESS] Saved ${insertedTrackIds.length} tracks and ${albumDocs.length} albums for genre: ${config.genre}`);
  }

  console.log("\n====================================================");
  console.log("FINAL SEEDING VERIFICATION:");
  let totalCount = 0;
  for (const [genre, count] of Object.entries(finalSummary)) {
    console.log(`- ${genre.padEnd(14)}: ${count} songs`);
    totalCount += count;
  }
  console.log(`----------------------------------------------------`);
  console.log(`Total Unique Songs Seeded: ${totalCount}`);
  console.log(`Total Distinct Global Keys: ${globalSeenKeys.size}`);
  console.log("====================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. Seeding finished successfully!");
  process.exit(0);
}

seedAllGenres().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
