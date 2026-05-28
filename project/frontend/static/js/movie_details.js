const API_BASE = "http://127.0.0.1:8000";
const movieId = new URLSearchParams(location.search).get("id");
const userId = localStorage.getItem("user_id");

let currentMovieTitle = "";

const img = (path, size = "w500") =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : "../static/media/images/default_movie.png";

async function loadMovie() {
    try {
        const res = await fetch(`${API_BASE}/movie/details/${movieId}`, { credentials: "include" });
        if (!res.ok) throw new Error(res.status);
        const d = await res.json();
        currentMovieTitle = d.title;

        // User Rating
        let userRatingHtml = "";
        let initialRating = 0;
        try {
            const ratingRes = await fetch(`${API_BASE}/movie/rate/${movieId}/${userId}`);
            const ratingData = await ratingRes.json();
            if (ratingData.rating && ratingData.rating > 0) {
                initialRating = ratingData.rating;
                userRatingHtml = `
                    <div class="metric-card" id="user-rating-card" style="border-left: 5px solid #22c55e;">
                        <div class="m-label">Your Rating</div>
                        <div class="m-value">⭐ ${ratingData.rating}</div>
                    </div>`;
            }
        } catch (err) { console.error("Rating check failed", err); }

        const crew = d.credits?.crew || [];
        const cast = d.credits?.cast || [];
        const directors = crew.filter(c => c.job === "Director").map(c => c.name).join(", ") || "N/A";
        const writers = crew.filter(c => c.department === "Writing").map(c => c.name).slice(0,3).join(", ") || "N/A";

        // Render
        document.getElementById("details-content").innerHTML = `
        <button class="back-btn" onclick="history.back()">← Back</button>
        <div class="hero">
            <img class="poster" src="${img(d.poster_path)}">
            <div style="flex:1">
                <h1>${d.title}</h1>
                <p style="color:var(--accent-blue); font-style:italic; margin-bottom: 15px;">${d.tagline || ""}</p>

                <div class="metrics">
                    <div class="metric-card">
                        <div class="m-label">TMDB Rating</div>
                        <div class="m-value">⭐ ${d.vote_average?.toFixed(1)} (${d.vote_count})</div>
                    </div>
                    ${userRatingHtml}
                    <div class="metric-card">
                        <div class="m-label">Runtime</div>
                        <div class="m-value">${d.runtime} min</div>
                    </div>
                    <div class="metric-card">
                        <div class="m-label">Release</div>
                        <div class="m-value">${d.release_date}</div>
                    </div>
                    <div class="metric-card">
                        <div class="m-label">Language</div>
                        <div class="m-value">${d.original_language?.toUpperCase()}</div>
                    </div>
                </div>

                <p><b>Genres:</b> ${d.genres?.map(g=>g.name).join(", ")}</p>
                <p><b>Director:</b> ${directors}</p>
                <p><b>Writer:</b> ${writers}</p>
                ${d.external_ids?.imdb_id ? `<p><b>IMDb:</b> <a target="_blank" href="https://www.imdb.com/title/${d.external_ids.imdb_id}">${d.external_ids.imdb_id}</a></p>` : ""}

                <div style="margin-top:20px;">
                    <button id="watchlistBtn" class="watchlist-btn" onclick="toggleWatchlist()">
                        <span>+</span> Add to Watchlist
                    </button>
                    <div class="rating-wrap" style="margin-top:15px;">
                        <div class="stars" id="starBox">
                            <span data-v="1">★</span><span data-v="2">★</span><span data-v="3">★</span>
                            <span data-v="4">★</span><span data-v="5">★</span>
                        </div>
                        <div class="rating-value" id="ratingValue">0/5</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Overview</h2>
            <p>${d.overview}</p>
        </div>

        <div class="section">
            <h2>🎭 Cast</h2>
            <div class="cast-grid">
                ${cast.slice(0,18).map(a=>`
                    <div class="actor-card">
                        <img class="actor-img" src="${img(a.profile_path,'w185')}">
                        <b>${a.name}</b><br>
                        <span style="color:var(--accent-blue)">${a.character}</span>
                    </div>
                `).join("")}
            </div>
        </div>

        <div class="section">
            <h2>🎥 Trailers</h2>
            ${d.videos.results.filter(v=>v.site==="YouTube").slice(0,2).map(v=>`
                <iframe width="100%" height="315" src="https://www.youtube.com/embed/${v.key}" allowfullscreen></iframe>
                <p>${v.name}</p>
            `).join("") || "<p>No videos available.</p>"}
        </div>

        <div class="section">
            <h2>📅 Release Dates</h2>
            ${d.release_dates.results.map(c=>`
                <div class="box">
                    <b>${c.iso_3166_1}</b>
                    <ul>${c.release_dates.map(r=>`
                        <li>${r.release_date.split("T")[0]} ${r.certification ? `(${r.certification})`:""}</li>
                    `).join("")}</ul>
                </div>
            `).join("")}
        </div>

        <div class="section">
            <h2>📺 Watch Providers</h2>
            ${Object.entries(d["watch/providers"].results || {}).map(([c,p])=>`
                <div class="box">
                    <b>${c}</b><br>
                    ${p.flatrate?.map(f=>`<img width="40" src="${img(f.logo_path,'w92')}"> ${f.provider_name}`).join("") || "No streaming info"}
                </div>
            `).join("") || "<p>No providers listed.</p>"}
        </div>

        <div class="section">
            <h2>🔥 Similar Movies</h2>
            ${d.recommendations?.results?.slice(0,6).map(m=>`
                <div class="box" style="display:flex; align-items:center; gap:15px; cursor:pointer;" onclick="location.href='movie_details.html?id=${m.id}'">
                    <img src="${img(m.poster_path,'w185')}" width="100">
                    <b>${m.title}</b>
                </div>
            `).join("") || "<p>No similar movies available.</p>"}
        </div>

        <div class="section">
            <h2>🏷 Keywords</h2>
            ${d.keywords?.keywords?.length
                ? d.keywords.keywords.map(k=>`<span class="tag">${k.name}</span>`).join("")
                : "<p>None</p>"
            }
        </div>

        <div class="section">
            <h2>📝 Reviews</h2>
            ${d.reviews.results.slice(0,3).map(r=>`
                <div class="box">
                    <b>${r.author}</b>
                    <p>${r.content.slice(0,500)}…</p>
                </div>
            `).join("") || "<p>No reviews.</p>"}
        </div>
        `;

        initRatingSystem(initialRating);
        checkWatchlistStatus();

    } catch {
        document.getElementById("details-content").innerHTML = "<h2>Failed to load movie.</h2>";
    }
}


// Watchlist logic
async function checkWatchlistStatus() {
    const btn = document.getElementById("watchlistBtn");
    try {
        const res = await fetch(`${API_BASE}/watchlist/check/${userId}/${movieId}`);
        const data = await res.json();
        if (data.inWatchlist) {
            btn.classList.add("added");
            btn.innerHTML = `<span>✓</span> In Watchlist`;
        }
    } catch (err) { console.error(err); }
}

async function toggleWatchlist() {
    const btn = document.getElementById("watchlistBtn");
    const isAdding = !btn.classList.contains("added");
    if (isAdding) {
        btn.classList.add("added");
        btn.innerHTML = `<span>✓</span> In Watchlist`;
    } else {
        btn.classList.remove("added");
        btn.innerHTML = `<span>+</span> Add to Watchlist`;
    }

    try {
        const action = isAdding ? "add" : "remove";
        await fetch(`${API_BASE}/watchlist/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                user_id: userId, 
                movie_id: parseInt(movieId),
                movie_name: currentMovieTitle
            })
        });
    } catch (err) { btn.classList.toggle("added"); }
}

// Rating system
function initRatingSystem(initialValue) {
    const stars = document.querySelectorAll("#starBox span");
    const ratingValue = document.getElementById("ratingValue");
    const updateUI = (val) => {
        ratingValue.innerText = `${val}/5`;
        stars.forEach(s => s.classList.toggle("active", Number(s.dataset.v) <= val));
    };
    if (initialValue > 0) updateUI(initialValue);
    stars.forEach(star => {
        star.addEventListener("click", async () => {
            const v = Number(star.dataset.v);
            updateUI(v);
            try {
                await fetch(`${API_BASE}/movie/rate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: userId, movie_id: parseInt(movieId), rating: v })
                });
                document.getElementById("user-rating-container").innerHTML = `
                    <div class="metric-card" style="border-left: 5px solid #22c55e;">
                        <div class="m-label">Your Rating</div>
                        <div class="m-value">⭐ ${v}</div>
                    </div>`;
            } catch (err) { console.error(err); }
        });
    });
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
loadMovie();
