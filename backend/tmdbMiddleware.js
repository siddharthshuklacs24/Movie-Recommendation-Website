const { tmdbRequest } = require("./tmdb");

const checkTMDBKey = async (req, res, next) => {
  const tmdbKey = req.cookies.tmdbKey;

  // 🔴 No API key
  if (!tmdbKey) {
    return res.status(401).json({
      error: "TMDB_KEY_MISSING"
    });
  }

  try {
    // 🔎 Validate key with TMDB
    await tmdbRequest("/configuration", tmdbKey);
    next();
  } catch (err) {
    // 🔴 Invalid / expired API key
    return res.status(403).json({
      error: "TMDB_KEY_INVALID"
    });
  }
};

module.exports = { checkTMDBKey };
