const express = require("express");
const axios = require("axios");

const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";

/* ---------- HELPER ---------- */
async function tmdbGet(url, apiKey, params = {}) {
  return axios.get(`${TMDB_BASE}${url}`, {
    params: {
      api_key: apiKey,
      ...params
    }
  });
}

/* ---------- MIDDLEWARE ---------- */
async function requireTMDBKey(req, res, next) {
  const key = req.cookies.tmdbKey;

  if (!key) {
    return res.status(401).json({ error: "TMDB_KEY_MISSING" });
  }

  try {
    await tmdbGet("/configuration", key);
    req.tmdbKey = key;
    next();
  } catch (err) {
    return res.status(403).json({ error: "TMDB_KEY_INVALID" });
  }
}

/* ========================================================= */
/* ================== REQUIRED FOR TRENDREC ================= */
/* ========================================================= */

// 🔥 TRENDING MOVIES
router.get("/movies/trending", requireTMDBKey, async (req, res) => {
  try {
    const response = await tmdbGet("/trending/movie/day", req.tmdbKey);
    res.json(response.data.results);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
});

// 🔥 RECENT MOVIES (Now Playing)
router.get("/movies/recent", requireTMDBKey, async (req, res) => {
  try {
    const response = await tmdbGet("/movie/now_playing", req.tmdbKey);
    res.json(response.data.results);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recent movies" });
  }
});

/* ========================================================= */
/* ================= EXISTING ROUTES (UNCHANGED) ============ */
/* ========================================================= */

router.get("/movie/details/:id", requireTMDBKey, async (req, res) => {
  try {
    const movieId = req.params.id;

    const response = await tmdbGet(`/movie/${movieId}`, req.tmdbKey, {
      append_to_response: [
        "credits",
        "reviews",
        "videos",
        "images",
        "external_ids",
        "keywords",
        "recommendations",
        "similar",
        "release_dates",
        "watch/providers",
        "translations",
        "alternative_titles",
        "lists",
        "changes"
      ].join(",")
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// POPULAR MOVIES
router.get("/movies/popular", requireTMDBKey, async (req, res) => {
  try {
    const popular = await tmdbGet("/movie/popular", req.tmdbKey, { page: 1 });
    res.json(popular.data.results.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch popular movies" });
  }
});

// ACTOR SEARCH
router.get("/search/actor", requireTMDBKey, async (req, res) => {
  try {
    const name = req.query.name?.trim();
    if (!name) return res.status(400).json({ error: "Actor name required" });

    const result = await tmdbGet("/search/person", req.tmdbKey, { query: name });
    if (result.data.results.length === 0) {
      return res.status(404).json({ error: "Actor not found" });
    }

    res.json(result.data.results[0]);
  } catch (err) {
    res.status(500).json({ error: "Actor search failed" });
  }
});

// ACTOR MOVIES
router.get("/search/actor/movies", requireTMDBKey, async (req, res) => {
  try {
    const actorId = req.query.id;
    const page = req.query.page || 1;

    if (!actorId) return res.status(400).json({ error: "Actor ID required" });

    const movies = await tmdbGet("/discover/movie", req.tmdbKey, {
      with_cast: actorId,
      sort_by: "popularity.desc",
      page
    });

    res.json(movies.data.results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch movies for actor" });
  }
});

// GENRE SEARCH
router.get("/search/genre", requireTMDBKey, async (req, res) => {
  try {
    const input = req.query.genre?.trim().toLowerCase();
    const page = req.query.page || 1;

    if (!input) return res.status(400).json({ error: "Genre required" });

    const genresList = await tmdbGet("/genre/movie/list", req.tmdbKey);

    const found =
      genresList.data.genres.find(g => g.name.toLowerCase() === input) ||
      genresList.data.genres.find(g => g.name.toLowerCase().includes(input));

    if (!found) return res.status(404).json({ error: "Genre not found" });

    const movies = await tmdbGet("/discover/movie", req.tmdbKey, {
      with_genres: found.id,
      sort_by: "popularity.desc",
      page
    });

    res.json(movies.data.results);
  } catch (err) {
    res.status(500).json({ error: "Genre search failed" });
  }
});

// MOVIE SEARCH
router.get("/search/movie", requireTMDBKey, async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.status(400).json({ error: "Query required" });

    const result = await tmdbGet("/search/movie", req.tmdbKey, {
      query,
      include_adult: false
    });

    res.json(result.data.results);
  } catch (err) {
    res.status(500).json({ error: "Movie search failed" });
  }
});

module.exports = router;
