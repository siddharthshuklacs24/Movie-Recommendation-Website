const API_BASE = "http://127.0.0.1:8000";
const userId = localStorage.getItem("user_id");

async function fetchWatchlist() {
    const grid = document.getElementById("watchlist-grid");
    
    try {
        // 1. Get watchlist IDs from backend
        const response = await fetch(`${API_BASE}/watchlist/${userId}`);
        const moviesInWatchlist = await response.json();

        if (!moviesInWatchlist || moviesInWatchlist.length === 0) {
            grid.innerHTML = "<p style='color:gray;'>Your watchlist is empty.</p>";
            return;
        }

        grid.innerHTML = ""; 

        // 2. Fetch details for each movie from TMDB
        for (const item of moviesInWatchlist) {
            try {
                const movieRes = await fetch(`${API_BASE}/movie/details/${item.movie_id}`, {
                    credentials: "include"
                });

                if (!movieRes.ok) continue;
                const movie = await movieRes.json();

                const card = document.createElement("div");
                card.className = "watchlist-card";
                
                const poster = movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` 
                    : "../static/media/images/default_poster.png";

                card.innerHTML = `
                    <button class="remove-btn" title="Remove from watchlist" data-id="${movie.id}">×</button>
                    <img src="${poster}" alt="${movie.title}" onclick="location.href='movie_details.html?id=${movie.id}'">
                    <div class="card-info" onclick="location.href='movie_details.html?id=${movie.id}'">
                        <h3>${movie.title}</h3>
                    </div>
                `;
                
                // Add Remove Event
                card.querySelector(".remove-btn").addEventListener("click", (e) => {
                    e.stopPropagation();
                    removeFromWatchlist(movie.id, card);
                });

                grid.appendChild(card);
            } catch (err) {
                console.error("Error loading movie details:", err);
            }
        }
    } catch (error) {
        grid.innerHTML = "<p style='color:red;'>Failed to load watchlist.</p>";
    }
}

async function removeFromWatchlist(mId, cardElement) {
    if (!confirm("Remove this movie from your watchlist?")) return;
    
    try {
        const res = await fetch(`${API_BASE}/watchlist/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, movie_id: mId })
        });

        if (res.ok) {
            cardElement.remove();
            if (document.querySelectorAll(".watchlist-card").length === 0) {
                document.getElementById("watchlist-grid").innerHTML = "<p style='color:gray;'>Your watchlist is empty.</p>";
            }
        }
    } catch (err) {
        alert("Failed to remove movie");
    }
}

// 1. Logic to display the logged-in username
        const loggedInUsername = localStorage.getItem("username");
        const helloEl = document.getElementById("hellousername");

        if (loggedInUsername && helloEl) {
            helloEl.innerText = `Hello, ${loggedInUsername}!`;
        }

        // 2. Logout Logic with confirmation
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                const confirmLogout = confirm("Are you sure you want to logout?");
                if (confirmLogout) {
                    localStorage.clear();
                    window.location.href = "login.html";
                }
            });
        }

fetchWatchlist();