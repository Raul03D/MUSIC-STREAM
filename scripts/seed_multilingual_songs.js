require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");
const Music = require("../src/models/music.model");
const Album = require("../src/models/album.model");
const { uploadFile } = require("../src/services/storage.service");

// Song metadata catalog
const TRACKS_METADATA = [
  // ------------------ HINDI SONGS ------------------
  {
    searchQuery: "Kesariya",
    title: "Kesariya",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Bollywood Romantics: Arijit Hits",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    albumDesc: "The very best romantic Hindi chartbusters and soulful melodies.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    duration: 268,
    plays: 184500,
  },
  {
    searchQuery: "Tum Hi Ho",
    title: "Tum Hi Ho",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Bollywood Romantics: Arijit Hits",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    albumDesc: "The very best romantic Hindi chartbusters and soulful melodies.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    duration: 262,
    plays: 295000,
  },
  {
    searchQuery: "Channa Mereya",
    title: "Channa Mereya",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Bollywood Romantics: Arijit Hits",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    albumDesc: "The very best romantic Hindi chartbusters and soulful melodies.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    duration: 289,
    plays: 215400,
  },
  {
    searchQuery: "Apna Bana Le",
    title: "Apna Bana Le",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Bollywood Romantics: Arijit Hits",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    albumDesc: "The very best romantic Hindi chartbusters and soulful melodies.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    duration: 261,
    plays: 172800,
  },
  {
    searchQuery: "Raataan Lambiyan",
    title: "Raataan Lambiyan",
    artistName: "Jubin Nautiyal",
    artistEmail: "jubin@groovify.io",
    albumTitle: "Heartstrings: Hindi Melodies",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Acoustic and heartwarming Hindi love anthems.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    duration: 230,
    plays: 162900,
  },
  {
    searchQuery: "Shayad",
    title: "Shayad",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Bollywood Romantics: Arijit Hits",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    albumDesc: "The very best romantic Hindi chartbusters and soulful melodies.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    duration: 247,
    plays: 148200,
  },
  {
    searchQuery: "Agar Tum Saath Ho",
    title: "Agar Tum Saath Ho",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Heartstrings: Hindi Melodies",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Acoustic and heartwarming Hindi love anthems.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    duration: 341,
    plays: 312000,
  },
  {
    searchQuery: "Kal Ho Naa Ho",
    title: "Kal Ho Naa Ho",
    artistName: "Sonu Nigam",
    artistEmail: "sonu@groovify.io",
    albumTitle: "Heartstrings: Hindi Melodies",
    albumGenre: "Hindi",
    albumCover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Acoustic and heartwarming Hindi love anthems.",
    genre: "Hindi",
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
    duration: 322,
    plays: 388000,
  },

  // ------------------ BENGALI SONGS ------------------
  {
    searchQuery: "Tumi Jaake Bhalobasho",
    title: "Tumi Jaake Bhalobasho",
    artistName: "Anupam Roy",
    artistEmail: "anupam@groovify.io",
    albumTitle: "Kolkata Chronicles: Bangla Hits",
    albumGenre: "Bengali",
    albumCover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Contemporary Bengali melodies, poetic lyrics, and Kolkata feelings.",
    genre: "Bengali",
    coverImage: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    duration: 275,
    plays: 94000,
  },
  {
    searchQuery: "Amake Amar Moto Thakte Dao",
    title: "Amake Amar Moto Thakte Dao",
    artistName: "Anupam Roy",
    artistEmail: "anupam@groovify.io",
    albumTitle: "Kolkata Chronicles: Bangla Hits",
    albumGenre: "Bengali",
    albumCover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Contemporary Bengali melodies, poetic lyrics, and Kolkata feelings.",
    genre: "Bengali",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    duration: 298,
    plays: 135000,
  },
  {
    searchQuery: "Bojhena Shey Bojhena",
    title: "Bojhena Shey Bojhena",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Kolkata Chronicles: Bangla Hits",
    albumGenre: "Bengali",
    albumCover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Contemporary Bengali melodies, poetic lyrics, and Kolkata feelings.",
    genre: "Bengali",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    duration: 254,
    plays: 118000,
  },
  {
    searchQuery: "Aami Chini Go Chini",
    title: "Aami Chini Go Chini Tomare",
    artistName: "Somlata",
    artistEmail: "somlata@groovify.io",
    albumTitle: "Soulful Rabindra Sangeet",
    albumGenre: "Bengali",
    albumCover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Timeless Tagore classics rendered in beautiful acoustic tones.",
    genre: "Bengali",
    coverImage: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80",
    duration: 215,
    plays: 87000,
  },
  {
    searchQuery: "Tor Ek Kothaye",
    title: "Tor Ek Kothaye",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Kolkata Chronicles: Bangla Hits",
    albumGenre: "Bengali",
    albumCover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Contemporary Bengali melodies, poetic lyrics, and Kolkata feelings.",
    genre: "Bengali",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    duration: 236,
    plays: 72000,
  },
  {
    searchQuery: "Mon Majhi Re",
    title: "Mon Majhi Re",
    artistName: "Arijit Singh",
    artistEmail: "arijit@groovify.io",
    albumTitle: "Kolkata Chronicles: Bangla Hits",
    albumGenre: "Bengali",
    albumCover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Contemporary Bengali melodies, poetic lyrics, and Kolkata feelings.",
    genre: "Bengali",
    coverImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    duration: 326,
    plays: 96000,
  },
  {
    searchQuery: "Beche Thakar Gaan",
    title: "Benche Thakar Gaan",
    artistName: "Rupam Islam",
    artistEmail: "rupam@groovify.io",
    albumTitle: "Kolkata Chronicles: Bangla Hits",
    albumGenre: "Bengali",
    albumCover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Contemporary Bengali melodies, poetic lyrics, and Kolkata feelings.",
    genre: "Bengali",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    duration: 278,
    plays: 104000,
  },

  // ------------------ ENGLISH SONGS ------------------
  {
    searchQuery: "Blinding Lights",
    title: "Blinding Lights",
    artistName: "The Weeknd",
    artistEmail: "theweeknd@groovify.io",
    albumTitle: "After Hours: Global Hits",
    albumGenre: "English",
    albumCover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Worldwide topping electropop, synthwave, and chart-topping bangers.",
    genre: "English",
    coverImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    duration: 200,
    plays: 420000,
  },
  {
    searchQuery: "Shape of You",
    title: "Shape of You",
    artistName: "Ed Sheeran",
    artistEmail: "edsheeran@groovify.io",
    albumTitle: "After Hours: Global Hits",
    albumGenre: "English",
    albumCover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Worldwide topping electropop, synthwave, and chart-topping bangers.",
    genre: "English",
    coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    duration: 233,
    plays: 495000,
  },
  {
    searchQuery: "Starboy",
    title: "Starboy",
    artistName: "The Weeknd",
    artistEmail: "theweeknd@groovify.io",
    albumTitle: "After Hours: Global Hits",
    albumGenre: "English",
    albumCover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Worldwide topping electropop, synthwave, and chart-topping bangers.",
    genre: "English",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    duration: 230,
    plays: 360000,
  },
  {
    searchQuery: "Stay Justin Bieber",
    title: "STAY",
    artistName: "The Kid LAROI",
    artistEmail: "laroi@groovify.io",
    albumTitle: "After Hours: Global Hits",
    albumGenre: "English",
    albumCover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Worldwide topping electropop, synthwave, and chart-topping bangers.",
    genre: "English",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    duration: 141,
    plays: 310000,
  },
  {
    searchQuery: "Faded Alan Walker",
    directAudioUrl: "https://raw.githubusercontent.com/ShivamJoker/sample-songs/master/Faded.mp3",
    title: "Faded",
    artistName: "Alan Walker",
    artistEmail: "alanwalker@groovify.io",
    albumTitle: "Neon Horizons: EDM Anthems",
    albumGenre: "English",
    albumCover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Epic melodic EDM, melancholic drops, and electronic synthesizers.",
    genre: "English",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    duration: 212,
    plays: 390000,
  },
  {
    searchQuery: "Bad Liar Imagine",
    directAudioUrl: "https://raw.githubusercontent.com/ShivamJoker/sample-songs/master/Bad%20Liar.mp3",
    title: "Bad Liar",
    artistName: "Imagine Dragons",
    artistEmail: "imaginedragons@groovify.io",
    albumTitle: "Neon Horizons: EDM Anthems",
    albumGenre: "English",
    albumCover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Epic melodic EDM, melancholic drops, and electronic synthesizers.",
    genre: "English",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    duration: 260,
    plays: 280000,
  },
  {
    searchQuery: "Death Bed Powfu",
    directAudioUrl: "https://raw.githubusercontent.com/ShivamJoker/sample-songs/master/Death%20Bed.mp3",
    title: "Death Bed (Coffee for Your Head)",
    artistName: "Powfu",
    artistEmail: "powfu@groovify.io",
    albumTitle: "Neon Horizons: EDM Anthems",
    albumGenre: "English",
    albumCover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    albumDesc: "Epic melodic EDM, melancholic drops, and electronic synthesizers.",
    genre: "English",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    duration: 173,
    plays: 245000,
  },
];

async function getOrCreateArtist(artistName, artistEmail) {
  let user = await User.findOne({ email: artistEmail.toLowerCase().trim() });
  if (!user) {
    user = await User.findOne({ username: artistName.trim() });
  }
  if (!user) {
    const hashedPassword = await bcrypt.hash("groovifyartist2026", 10);
    user = await User.create({
      username: artistName.trim(),
      email: artistEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: "artist",
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(artistName)}`,
    });
    console.log(`Created artist account: ${artistName}`);
  }
  return user;
}

async function getOrCreateAlbum(albumTitle, artistId, albumGenre, albumCover, albumDesc) {
  let album = await Album.findOne({ title: albumTitle.trim() });
  if (!album) {
    album = await Album.create({
      title: albumTitle.trim(),
      description: albumDesc || "",
      genre: albumGenre || "Various",
      coverImage: albumCover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
      releaseYear: 2026,
      artist: artistId,
      musics: [],
    });
    console.log(`Created album: ${albumTitle} (${albumGenre})`);
  }
  return album;
}

async function fetchAudioAndUpload(item) {
  // If directAudioUrl is provided, try that first
  let downloadUrl = item.directAudioUrl;

  if (!downloadUrl) {
    const searchUrl =
      "https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=" +
      encodeURIComponent(item.searchQuery);
    try {
      const res = await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      const match = data.songs?.data?.[0];
      if (match && match.more_info?.vlink) {
        downloadUrl = match.more_info.vlink;
      }
    } catch (e) {
      console.warn(`Search failed for ${item.title}:`, e.message);
    }
  }

  if (!downloadUrl) {
    throw new Error(`No audio stream URL available for ${item.title}`);
  }

  console.log(`Downloading audio stream for "${item.title}" from: ${downloadUrl}`);
  const audioRes = await fetch(downloadUrl, { signal: AbortSignal.timeout(12000) });
  if (!audioRes.ok) {
    throw new Error(`Failed to download audio: HTTP ${audioRes.status}`);
  }

  const arrayBuf = await audioRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  console.log(`Downloaded ${buffer.length} bytes for "${item.title}". Uploading to ImageKit...`);

  const cleanFilename = item.title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp3";
  const uploaded = await uploadFile(buffer, cleanFilename);
  return uploaded.url;
}

async function runSeed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully!");

  let createdCount = 0;
  let skippedCount = 0;

  for (const item of TRACKS_METADATA) {
    try {
      // Check if song already exists by title
      const existing = await Music.findOne({ title: item.title });
      if (existing) {
        console.log(`Song "${item.title}" already exists in DB. Skipping.`);
        skippedCount++;
        continue;
      }

      // 1. Get or create artist
      const artist = await getOrCreateArtist(item.artistName, item.artistEmail);

      // 2. Get or create album
      const album = await getOrCreateAlbum(
        item.albumTitle,
        artist._id,
        item.albumGenre,
        item.albumCover,
        item.albumDesc
      );

      // 3. Fetch audio and upload to ImageKit
      const uri = await fetchAudioAndUpload(item);

      // 4. Create Music document
      const music = await Music.create({
        uri,
        title: item.title,
        artist: artist._id,
        album: album._id,
        coverImage: item.coverImage,
        duration: item.duration || 210,
        genre: item.genre,
        plays: item.plays || 12000,
        likes: [],
      });

      // 5. Add to album tracklist
      await Album.findByIdAndUpdate(album._id, {
        $addToSet: { musics: music._id },
      });

      console.log(`[SUCCESS] Track added: "${music.title}" (${item.genre}) -> Album: "${album.title}"`);
      createdCount++;

      // Small pause to be gentle with rate limits
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`[ERROR] Failed to seed track "${item.title}":`, err.message);
    }
  }

  console.log("\n=================================");
  console.log(`Seeding complete! Newly added: ${createdCount} tracks, Skipped existing: ${skippedCount} tracks.`);
  console.log("=================================");

  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
