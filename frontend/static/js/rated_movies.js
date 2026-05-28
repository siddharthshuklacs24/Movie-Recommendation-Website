const API_BASE = "http://127.0.0.1:8000";
const userId = localStorage.getItem("user_id");

async function fetchRatedMovies() {
    const grid = document.getElementById("rated-grid");
    
    try {
        const response = await fetch(`${API_BASE}/user/ratings/${userId}`);
        const ratings = await response.json();

        if (!ratings || ratings.length === 0) {
            grid.innerHTML = "<p style='color:gray;'>You haven't rated any movies yet.</p>";
            return;
        }

        grid.innerHTML = ""; 

        for (const item of ratings) {
            try {
                // We must include credentials to send the TMDB Key cookie
                const movieRes = await fetch(`${API_BASE}/movie/details/${item.movie_id}`, {
                    credentials: "include"
                });

                if (!movieRes.ok) continue;

                const movie = await movieRes.json();
                const card = document.createElement("div");
                card.className = "rated-card";
                card.onclick = () => location.href = `movie_details.html?id=${movie.id}`;

                const poster = movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` 
                    : "../static/media/images/default_poster.png";

                card.innerHTML = `
                    <div class="user-score">⭐ ${item.rating}</div>
                    <img src="${poster}" alt="${movie.title}">
                    <div class="card-info">
                        <h3>${movie.title || "Unknown Movie"}</h3>
                        <p style="color:gray; font-size:0.8rem;">Rated on: ${new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                `;
                grid.appendChild(card);
            } catch (err) {
                console.error("Error fetching TMDB details for:", item.movie_id);
            }
        }
    } catch (error) {
        grid.innerHTML = "<p style='color:red;'>Error loading your rated movies.</p>";
    }
}

// Navbar Logic
const loggedInUsername = localStorage.getItem("username");
const helloEl = document.getElementById("hellousername");
if (loggedInUsername && helloEl) helloEl.innerText = `Hello, ${loggedInUsername}!`;

document.getElementById("logoutBtn").addEventListener("click", () => {
    if(confirm("Logout?")) {
        localStorage.clear();
        window.location.href = "login.html";
    }
});

fetchRatedMovies();