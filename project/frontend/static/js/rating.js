document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://127.0.0.1:8000";
  const stars = document.querySelectorAll(".stars i");
  const ratingText = document.getElementById("ratingText");
  const saveBtn = document.getElementById("saveBtn");
  const backBtn = document.getElementById("backBtn");
  const status = document.getElementById("status");
  const poster = document.getElementById("poster");
  const titleEl = document.getElementById("movieTitle");

  let selectedRating = 0;

  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("id");
  const userId = localStorage.getItem("user_id");

  if (!movieId || !userId) {
    status.textContent = "Missing movie or user info";
    saveBtn.disabled = true;
    return;
  }

  /* ---------- 1. LOAD MOVIE DETAILS & PREVIOUS RATING ---------- */
  async function initPage() {
    try {
      // Fetch Movie Details
      const movieRes = await fetch(`${API_BASE}/movie/details/${movieId}`);
      const movie = await movieRes.json();
      titleEl.textContent = movie.title;
      if (movie.poster_path) {
        poster.src = `https://image.tmdb.org/t/p/w300${movie.poster_path}`;
      }

      // ✅ NEW: Fetch existing rating from your GET route: /movie/rate/:movieId/:userId
      const rateRes = await fetch(`${API_BASE}/movie/rate/${movieId}/${userId}`);
      const rateData = await rateRes.json();
      
      if (rateData.rating > 0) {
        selectedRating = rateData.rating;
        updateStars();
        status.textContent = "You previously rated this movie.";
      }
    } catch (err) {
      console.error("Initialization failed:", err);
    }
  }

  /* ---------- STAR CLICK ---------- */
  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.val);
      updateStars();
    });
  });

  function updateStars() {
    stars.forEach(s =>
      s.classList.toggle("active", Number(s.dataset.val) <= selectedRating)
    );
    ratingText.textContent = `Your rating: ${selectedRating}/5`;
  }

  /* ---------- SAVE RATING ---------- */
  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (selectedRating === 0) {
      status.style.color = "orange";
      status.textContent = "Select a rating first";
      return;
    }

    saveBtn.disabled = true;
    status.style.color = "white";
    status.textContent = "Saving...";

    try {
      const res = await fetch(`${API_BASE}/movie/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          movie_id: parseInt(movieId), // ✅ Ensure this is a number for Sequelize
          rating: selectedRating
        })
      });

      if (res.ok) {
        status.style.color = "#22c55e";
        status.textContent = "Rating saved successfully ✅";
        saveBtn.textContent = "Saved!";
        
        // Show Back Button
        backBtn.style.display = "block";
      } else {
        const data = await res.json();
        status.textContent = data.error || "Failed to save";
        saveBtn.disabled = false;
      }
    } catch (err) {
      status.textContent = "Server error. Check backend connection.";
      saveBtn.disabled = false;
    }
  });

  // Handle back button
  backBtn.addEventListener("click", () => {
    window.location.href = `movie_details.html?id=${movieId}`;
  });

  initPage();
});