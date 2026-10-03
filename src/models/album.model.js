const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        coverImage: {
            type: String,
            default: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        },
        genre: {
            type: String,
            default: "Various",
            trim: true,
        },
        releaseYear: {
            type: Number,
            default: () => new Date().getFullYear(),
        },
        musics: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "music",
            },
        ],
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

albumSchema.index({ title: "text", genre: "text" });

const albumModel = mongoose.model("album", albumSchema);

module.exports = albumModel;