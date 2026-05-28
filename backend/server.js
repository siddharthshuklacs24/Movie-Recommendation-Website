const ratingRoutes = require("./routes_rating");
require("dotenv").config();
const express = require("express");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { User, Rating, Watchlist } = require("./database");
const tmdbRoutes = require("./routes_tmdb");

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(express.json());
app.use(cookieParser());

// ✅ FIXED: Added port 5501 to the allowed origins
app.use(cors({
  origin: [
    "http://localhost:5500", 
    "http://127.0.0.1:5500", 
    "http://localhost:5501", 
    "http://127.0.0.1:5501"
  ],
  credentials: true
}));

app.use(ratingRoutes);

/* ---------- TMDB KEY HELPERS ---------- */
app.get("/debug", (req, res) => {
  res.json({ tmdbKeyExists: !!req.cookies.tmdbKey });
});

app.post("/tmdb/key", (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || apiKey.length < 10) {
    return res.status(400).json({ error: "Invalid TMDB key" });
  }
  res.cookie("tmdbKey", apiKey, { httpOnly: true, sameSite: "Lax" });
  res.json({ message: "TMDB key saved" });
});

app.use(tmdbRoutes);
app.get("/ping", (req, res) => res.send("pong"));

/* ---------- REGISTER ---------- */
app.post("/account/new", async (req, res) => {
  try {
    const { usernameFromInput, emailFromInput, phoneFromInput, passwordFromInput, confirmPasswordFromInput } = req.body;
    if (passwordFromInput !== confirmPasswordFromInput) return res.status(400).json({ error: "Passwords do not match" });
    const exists = await User.findOne({ where: { username: usernameFromInput } });
    if (exists) return res.status(400).json({ error: "User exists" });
    const hash = await argon2.hash(passwordFromInput);
    await User.create({ username: usernameFromInput, email: emailFromInput, phone: phoneFromInput, password: hash });
    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------- LOGIN ---------- */
app.post("/account/login", async (req, res) => {
  try {
    const { usernameFromInput, passwordFromInput } = req.body;
    const user = await User.findOne({ where: { username: usernameFromInput } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const valid = await argon2.verify(user.password, passwordFromInput);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET || "demo_secret", { expiresIn: "5m" });
    res.cookie("accessToken", token, { httpOnly: true });
    res.json({ message: "Login successful", user_id: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ---------- GET USER RATING FOR MOVIE ---------- */
app.get("/movie/user-rating/:userId/:movieId", async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    
    const ratingEntry = await Rating.findOne({
      where: { 
        user_id: userId,
        movie_id: movieId 
      },
      order: [['createdAt', 'DESC']] // In case there are multiple, get the latest
    });

    if (ratingEntry) {
      res.json({ rating: ratingEntry.rating });
    } else {
      res.json({ rating: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user rating" });
  }
});


// 1. ADD to watchlist
app.post("/watchlist/add", async (req, res) => {
    try {
        const { user_id, movie_id } = req.body;
        
        // Since your model requires movie_name, we should fetch it or allow it
        // For simplicity, let's assume we fetch it or pass a placeholder if not provided
        const newItem = await Watchlist.create({ 
            user_id, 
            movie_id, 
            movie_name: req.body.movie_name || "Unknown Title" 
        });
        res.status(201).json(newItem);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Already in watchlist" });
    }
});

// 2. REMOVE from watchlist
app.post("/watchlist/remove", async (req, res) => {
    try {
        await Watchlist.destroy({ 
            where: { user_id: req.body.user_id, movie_id: req.body.movie_id } 
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Error removing item" });
    }
});

// 3. GET user's watchlist
app.get("/watchlist/:user_id", async (req, res) => {
    try {
        const list = await Watchlist.findAll({ 
            where: { user_id: req.params.user_id },
            order: [['createdAt', 'DESC']]
        });
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: "Error fetching watchlist" });
    }
});

// 4. CHECK if specific movie is in watchlist
app.get("/watchlist/check/:userId/:movieId", async (req, res) => {
    try {
        const item = await Watchlist.findOne({ 
            where: { user_id: req.params.userId, movie_id: req.params.movieId } 
        });
        res.json({ inWatchlist: !!item });
    } catch (err) {
        res.json({ inWatchlist: false });
    }
});


/* ---------- START SERVER ---------- */
app.listen(8000, () => {
  console.log("🚀 Server running on port 8000");
});