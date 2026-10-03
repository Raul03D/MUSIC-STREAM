const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function registerUser(req, res) {
    try {
        const { username, email, password, role = "user" } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email, and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.trim();

        const isUserAlreadyExists = await userModel.findOne({
            $or: [
                { username: normalizedUsername },
                { email: normalizedEmail },
            ],
        });

        if (isUserAlreadyExists) {
            return res.status(409).json({ message: "Username or email is already registered" });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hash,
            role: role === "artist" ? "artist" : "user",
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                likedMusics: user.likedMusics || [],
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Registration failed. " + error.message });
    }
}

async function loginUser(req, res) {
    try {
        const { email, username, password } = req.body;

        if (!email && !username) {
            return res.status(400).json({
                message: "Provide an email or username",
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Password is required",
            });
        }

        const query = email
            ? { email: email.toLowerCase().trim() }
            : { username: username.trim() };

        const user = await userModel.findOne(query);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                likedMusics: user.likedMusics || [],
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Login failed. " + error.message });
    }
}

async function getMe(req, res) {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("-password").populate("likedMusics");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                likedMusics: user.likedMusics || [],
            },
        });
    } catch (error) {
        console.error("getMe error:", error);
        return res.status(500).json({ message: "Failed to get profile" });
    }
}

async function logoutUser(req, res) {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.status(200).json({ message: "User logged out successfully" });
}

module.exports = { registerUser, loginUser, logoutUser, getMe };