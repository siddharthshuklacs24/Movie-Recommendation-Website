const express = require("express");
const router = express.Router();
const { Rating } = require("./database");

// 1. GET ALL RATINGS (Used for the My Ratings page)
router.get("/user/ratings/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const ratings = await Rating.findAll({
            where: { user_id: user_id },
            order: [['updatedAt', 'DESC']] 
        });
        res.json(ratings);
    } catch (err) {
        console.error("Error fetching user ratings:", err);
        res.status(500).json({ error: "Failed to fetch ratings" });
    }
});

// 2. SAVE OR UPDATE RATING
router.post("/movie/rate", async (req, res) => {
    try {
        const { user_id, movie_id, rating } = req.body;
        if (!user_id || !movie_id || !rating) return res.status(400).json({ error: "Missing fields" });

        await Rating.upsert({ user_id, movie_id, rating });
        res.json({ message: "Rating saved successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save rating" });
    }
});

// 3. GET SINGLE RATING (Used for the star display on details page)
router.get("/movie/rate/:movieId/:userId", async (req, res) => {
    try {
        const { movieId, userId } = req.params;
        const existing = await Rating.findOne({ where: { movie_id: movieId, user_id: userId } });
        res.json({ rating: existing ? existing.rating : 0 });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rating" });
    }
});

module.exports = router;