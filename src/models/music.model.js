const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema(
    {
        uri: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        album: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "album",
            default: null,
        },
        coverImage: {
            type: String,
            default: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        },
        duration: {
            type: Number,
            default: 180, // duration in seconds
        },
        genre: {
            type: String,
            default: "Synthwave",
            trim: true,
        },
        plays: {
            type: Number,
            default: 0,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Add search index on title and genre
musicSchema.index({ title: "text", genre: "text" });

const musicModel = mongoose.model("music", musicSchema);

module.exports = musicModel;