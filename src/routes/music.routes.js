const express = require("express");
const musicController = require("../controllers/music.controller");
const { authArtist, authUser, optionalAuth } = require("../middlewares/auth.middleware");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max audio file
});

const router = express.Router();

// Public & optional-auth browsing endpoints
router.get("/home-feed", optionalAuth, musicController.getHomeFeed);
router.get("/", optionalAuth, musicController.getAllMusics);
router.get("/albums", optionalAuth, musicController.getAllAlbums);
router.get("/albums/:albumId", optionalAuth, musicController.getAlbumById);
router.get("/liked/all", authUser, musicController.getLikedMusics);
router.get("/:musicId", optionalAuth, musicController.getMusicById);

// Interactivity endpoints
router.post("/:musicId/like", authUser, musicController.likeMusic);
router.post("/:musicId/play", optionalAuth, musicController.recordPlay);

// Artist management endpoints
router.post("/upload", authArtist, upload.single("music"), musicController.createMusic);
router.post("/album", authArtist, musicController.createAlbum);

module.exports = router;