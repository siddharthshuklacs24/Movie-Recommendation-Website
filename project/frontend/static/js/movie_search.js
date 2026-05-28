const API_BASE = `${location.protocol}//${location.hostname}:8000`;
const resultsEl = document.getElementById("results");
const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");

/* USER */
const username = localStorage.getItem("username");
if (username) document.getElementById("hellousername").innerText = `Hello, ${username}!`;

document.getElementById("logoutBtn").onclick = () => {
    if (confirm("Logout?")) {
        localStorage.clear();
        location.href = "login.html";
    }
};

/* RESTORE LAST SEARCH */
const lastQuery = localStorage.getItem("lastSearchQuery");
if (lastQuery) {
    input.value = lastQuery;
    performSearch(lastQuery);
}

/* SEARCH FUNCTION */
async function performSearch(q) {
    if (q.length < 2) return;
    const res = await fetch(`${API_BASE}/search/movie?q=${encodeURIComponent(q)}`, {
        credentials: "include"
    });
    const movies = await res.json();
    resultsEl.innerHTML = "";

    movies.forEach(m => {
        const card = document.createElement("div");
        card.className = "movie-card";
        card.onclick = () => location.href = `movie_details.html?id=${m.id}`;

        const img = document.createElement("img");
        img.src = m.poster_path
            ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
            : "../static/media/images/default_movie.png";

        card.appendChild(img);
        resultsEl.appendChild(card);
    });
}

/* FORM SUBMIT */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) return;

    localStorage.setItem("lastSearchQuery", q);
    performSearch(q);
});

/* CLEAR LAST SEARCH IF INPUT CLEARED */
input.addEventListener("input", () => {
    if (!input.value.trim()) {
        localStorage.removeItem("lastSearchQuery");
        resultsEl.innerHTML = "";
    }
});
