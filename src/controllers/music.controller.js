const mongoose = require("mongoose");
const musicModel = require("../models/music.model");
const albumModel = require("../models/album.model");
const userModel = require("../models/user.model");
const { uploadFile } = require("../services/storage.service");

// Default high-quality cover images for different genres
const DEFAULT_COVERS = {
    hindi: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    bengali: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    english: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    bollywood: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    synthwave: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    electronic: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    lofi: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    pop: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    rock: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    ambient: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
};

async function createMusic(req, res) {
    try {
        const { title, genre = "Synthwave", duration = 180, albumId, coverImage } = req.body;
        const file = req.file;

        if (!title) {
            return res.status(400).json({ message: "Song title is required" });
        }

        if (!file) {
            return res.status(400).json({ message: "Audio file is required" });
        }

        // Upload audio file (ImageKit or local storage fallback)
        const uploadResult = await uploadFile(file.buffer, file.originalname);

        // Pick or generate cover image
        const normalizedGenre = (genre || "synthwave").toLowerCase().replace(/[^a-z]/g, "");
        const finalCover = coverImage || DEFAULT_COVERS[normalizedGenre] || DEFAULT_COVERS.synthwave;

        const musicData = {
            uri: uploadResult.url,
            title: title.trim(),
            artist: req.user.id,
            genre: genre.trim(),
            duration: Number(duration) || 180,
            coverImage: finalCover,
            plays: 0,
            likes: [],
        };

        if (albumId && mongoose.Types.ObjectId.isValid(albumId)) {
            musicData.album = albumId;
        }

        const music = await musicModel.create(musicData);

        // If part of an album, update the album's tracklist
        if (albumId && mongoose.Types.ObjectId.isValid(albumId)) {
            await albumModel.findByIdAndUpdate(albumId, {
                $addToSet: { musics: music._id },
            });
        }

        const populatedMusic = await musicModel.findById(music._id).populate("artist", "username email");

        return res.status(201).json({
            message: "Track created successfully",
            music: populatedMusic,
        });
    } catch (error) {
        console.error("createMusic error:", error);
        return res.status(500).json({ message: "Failed to create music: " + error.message });
    }
}

async function createAlbum(req, res) {
    try {
        const { title, description = "", genre = "Various", coverImage, musics = [], releaseYear } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Album title is required" });
        }

        const normalizedGenre = (genre || "synthwave").toLowerCase().replace(/[^a-z]/g, "");
        const finalCover = coverImage || DEFAULT_COVERS[normalizedGenre] || DEFAULT_COVERS.synthwave;

        const album = await albumModel.create({
            title: title.trim(),
            description: description.trim(),
            genre: genre.trim(),
            coverImage: finalCover,
            releaseYear: Number(releaseYear) || new Date().getFullYear(),
            musics: Array.isArray(musics) ? musics : [],
            artist: req.user.id,
        });

        // Update tracks to reference this album
        if (Array.isArray(musics) && musics.length > 0) {
            await musicModel.updateMany(
                { _id: { $in: musics } },
                { $set: { album: album._id } }
            );
        }

        const populatedAlbum = await albumModel.findById(album._id)
            .populate("artist", "username email")
            .populate("musics");

        return res.status(201).json({
            message: "Album created successfully",
            album: populatedAlbum,
        });
    } catch (error) {
        console.error("createAlbum error:", error);
        return res.status(500).json({ message: "Failed to create album: " + error.message });
    }
}

async function getAllMusics(req, res) {
    try {
        const { search, genre, artist, album, sort = "popular", limit = 50, page = 1 } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search.trim(), $options: "i" } },
                { genre: { $regex: search.trim(), $options: "i" } },
            ];
        }

        if (genre && genre !== "All") {
            filter.genre = { $regex: new RegExp(`^${genre.trim()}$`, "i") };
        }

        if (artist && mongoose.Types.ObjectId.isValid(artist)) {
            filter.artist = artist;
        }

        if (album && mongoose.Types.ObjectId.isValid(album)) {
            filter.album = album;
        }

        let sortOption = { plays: -1, createdAt: -1 };
        if (sort === "newest") {
            sortOption = { createdAt: -1 };
        } else if (sort === "title") {
            sortOption = { title: 1 };
        } else if (sort === "popular") {
            sortOption = { plays: -1 };
        }

        const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 1000);
        const parsedPage = Math.max(Number(page) || 1, 1);
        const skip = (parsedPage - 1) * parsedLimit;

        const [musics, total] = await Promise.all([
            musicModel
                .find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(parsedLimit)
                .populate("artist", "username email")
                .populate("album", "title coverImage")
                .lean(),
            musicModel.countDocuments(filter),
        ]);

        const currentUserId = req.user ? req.user.id.toString() : null;

        // Enhance with isLiked and likesCount
        const enhancedMusics = musics.map((track) => ({
            ...track,
            likesCount: track.likes ? track.likes.length : 0,
            isLiked: currentUserId && track.likes
                ? track.likes.some((id) => id.toString() === currentUserId)
                : false,
        }));

        return res.status(200).json({
            message: "Tracks fetched successfully",
            total,
            page: parsedPage,
            totalPages: Math.ceil(total / parsedLimit),
            musics: enhancedMusics,
        });
    } catch (error) {
        console.error("getAllMusics error:", error);
        return res.status(500).json({ message: "Failed to fetch musics: " + error.message });
    }
}

async function getMusicById(req, res) {
    try {
        const { musicId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(musicId)) {
            return res.status(400).json({ message: "Invalid track ID" });
        }

        const track = await musicModel.findById(musicId)
            .populate("artist", "username email")
            .populate("album", "title coverImage description")
            .lean();

        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }

        const currentUserId = req.user ? req.user.id.toString() : null;
        const enhanced = {
            ...track,
            likesCount: track.likes ? track.likes.length : 0,
            isLiked: currentUserId && track.likes
                ? track.likes.some((id) => id.toString() === currentUserId)
                : false,
        };

        return res.status(200).json({
            message: "Track fetched successfully",
            music: enhanced,
        });
    } catch (error) {
        console.error("getMusicById error:", error);
        return res.status(500).json({ message: "Failed to fetch track" });
    }
}

async function getAllAlbums(req, res) {
    try {
        const { search, genre } = req.query;
        const filter = {};

        if (search) {
            filter.title = { $regex: search.trim(), $options: "i" };
        }

        if (genre && genre !== "All") {
            filter.genre = { $regex: new RegExp(`^${genre.trim()}$`, "i") };
        }

        const albums = await albumModel
            .find(filter)
            .populate("artist", "username email")
            .populate("musics", "title duration coverImage plays")
            .sort({ createdAt: -1 })
            .lean();

        const formattedAlbums = albums.map((album) => ({
            ...album,
            tracksCount: album.musics ? album.musics.length : 0,
        }));

        return res.status(200).json({
            message: "Albums fetched successfully",
            albums: formattedAlbums,
        });
    } catch (error) {
        console.error("getAllAlbums error:", error);
        return res.status(500).json({ message: "Failed to fetch albums: " + error.message });
    }
}

async function getAlbumById(req, res) {
    try {
        const { albumId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({ message: "Invalid album ID" });
        }

        const album = await albumModel
            .findById(albumId)
            .populate("artist", "username email")
            .populate({
                path: "musics",
                populate: { path: "artist", select: "username email" },
            })
            .lean();

        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        const currentUserId = req.user ? req.user.id.toString() : null;

        if (album.musics && album.musics.length > 0) {
            album.musics = album.musics.map((track) => ({
                ...track,
                likesCount: track.likes ? track.likes.length : 0,
                isLiked: currentUserId && track.likes
                    ? track.likes.some((id) => id.toString() === currentUserId)
                    : false,
            }));
        }

        return res.status(200).json({
            message: "Album fetched successfully",
            album,
        });
    } catch (error) {
        console.error("getAlbumById error:", error);
        return res.status(500).json({ message: "Failed to fetch album: " + error.message });
    }
}

async function likeMusic(req, res) {
    try {
        const { musicId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(musicId)) {
            return res.status(400).json({ message: "Invalid music ID" });
        }

        const track = await musicModel.findById(musicId);
        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }

        const isLiked = track.likes.some((id) => id.toString() === userId.toString());

        if (isLiked) {
            // Unlike
            track.likes = track.likes.filter((id) => id.toString() !== userId.toString());
            await track.save();
            await userModel.findByIdAndUpdate(userId, {
                $pull: { likedMusics: musicId },
            });

            return res.status(200).json({
                message: "Removed from Liked Songs",
                liked: false,
                likesCount: track.likes.length,
            });
        } else {
            // Like
            track.likes.push(userId);
            await track.save();
            await userModel.findByIdAndUpdate(userId, {
                $addToSet: { likedMusics: musicId },
            });

            return res.status(200).json({
                message: "Added to Liked Songs",
                liked: true,
                likesCount: track.likes.length,
            });
        }
    } catch (error) {
        console.error("likeMusic error:", error);
        return res.status(500).json({ message: "Failed to like track" });
    }
}

async function recordPlay(req, res) {
    try {
        const { musicId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(musicId)) {
            return res.status(400).json({ message: "Invalid track ID" });
        }

        const updated = await musicModel.findByIdAndUpdate(
            musicId,
            { $inc: { plays: 1 } },
            { new: true }
        ).select("plays");

        return res.status(200).json({
            message: "Play count updated",
            plays: updated ? updated.plays : 0,
        });
    } catch (error) {
        console.error("recordPlay error:", error);
        return res.status(500).json({ message: "Failed to record play" });
    }
}

async function getLikedMusics(req, res) {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).populate({
            path: "likedMusics",
            populate: { path: "artist", select: "username email" },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const tracks = (user.likedMusics || []).map((t) => ({
            ...t.toObject(),
            isLiked: true,
            likesCount: t.likes ? t.likes.length : 0,
        }));

        return res.status(200).json({
            message: "Liked tracks fetched successfully",
            musics: tracks,
        });
    } catch (error) {
        console.error("getLikedMusics error:", error);
        return res.status(500).json({ message: "Failed to fetch liked tracks" });
    }
}

async function getHomeFeed(req, res) {
    try {
        const currentUserId = req.user ? req.user.id.toString() : null;

        const [albums, trending, latest, totalTracks, totalAlbums] = await Promise.all([
            albumModel
                .find()
                .populate("artist", "username")
                .populate("musics", "title duration coverImage")
                .limit(16)
                .lean(),
            musicModel
                .find()
                .sort({ plays: -1 })
                .limit(16)
                .populate("artist", "username")
                .populate("album", "title")
                .lean(),
            musicModel
                .find()
                .sort({ createdAt: -1 })
                .limit(16)
                .populate("artist", "username")
                .lean(),
            musicModel.countDocuments(),
            albumModel.countDocuments(),
        ]);

        const formatTrack = (t) => ({
            ...t,
            likesCount: t.likes ? t.likes.length : 0,
            isLiked: currentUserId && t.likes
                ? t.likes.some((id) => id.toString() === currentUserId)
                : false,
        });

        const genres = [
            "Hindi",
            "Bengali",
            "English",
            "Bollywood",
            "Pop",
            "Lo-Fi",
            "Synthwave",
            "Electronic",
            "Rock",
            "Ambient",
        ];

        return res.status(200).json({
            message: "Home feed fetched successfully",
            featuredAlbums: albums,
            trendingTracks: trending.map(formatTrack),
            latestTracks: latest.map(formatTrack),
            genres,
            stats: {
                totalTracks,
                totalAlbums,
            },
        });
    } catch (error) {
        console.error("getHomeFeed error:", error);
        return res.status(500).json({ message: "Failed to fetch feed: " + error.message });
    }
}

module.exports = {
    createMusic,
    createAlbum,
    getAllMusics,
    getMusicById,
    getAllAlbums,
    getAlbumById,
    likeMusic,
    recordPlay,
    getLikedMusics,
    getHomeFeed,
};