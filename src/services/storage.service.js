const { ImageKit } = require("@imagekit/nodejs");
const fs = require("fs");
const path = require("path");

let ImageKitClient = null;
try {
    if (process.env.ImageKit_PRIVATE_KEY) {
        ImageKitClient = new ImageKit({
            privateKey: process.env.ImageKit_PRIVATE_KEY,
        });
    }
} catch (e) {
    console.warn("ImageKit initialization note:", e.message);
}

async function uploadFile(bufferOrBase64, originalName = "track.mp3") {
    // Attempt ImageKit first
    if (ImageKitClient && process.env.ImageKit_PRIVATE_KEY) {
        try {
            const base64String = Buffer.isBuffer(bufferOrBase64)
                ? bufferOrBase64.toString("base64")
                : bufferOrBase64;

            const result = await ImageKitClient.files.upload({
                file: base64String,
                fileName: "music_" + Date.now() + "_" + (path.extname(originalName) || ".mp3"),
                folder: "Complete_Backend2/music",
            });
            if (result && result.url) {
                return result;
            }
        } catch (err) {
            console.warn("ImageKit upload warning, using local file storage:", err.message);
        }
    }

    // Local storage fallback so uploads never fail
    const uploadsDir = path.join(__dirname, "../../public/uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(originalName) || ".mp3";
    const filename = `music_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.isBuffer(bufferOrBase64)
        ? bufferOrBase64
        : Buffer.from(bufferOrBase64, "base64");

    fs.writeFileSync(filePath, buffer);

    return {
        url: `/uploads/${filename}`,
        name: filename,
        size: buffer.length,
    };
}

module.exports = { uploadFile };