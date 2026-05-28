document.addEventListener("DOMContentLoaded", async () => {
    let renderRequestId = 0;

    const API_BASE = `${location.protocol}//${location.hostname}:8000`;
    const VISIBLE = 5;

    const nodes = {
        input: document.querySelector(".artist-input"),
        dropdown: document.querySelector(".actor-suggestions"),
        chips: document.getElementById("selectedChips"),
        checkboxes: document.querySelectorAll(".tags-container input[type=checkbox]"),
        gallery: document.querySelector(".scroll-container"),
        title: document.querySelector(".gallery-title"),
        btnRight: document.querySelector(".scroll-btn.right"),
        btnLeft: document.querySelector(".scroll-btn.left")
    };

    let allMovies = [];
    let currentIndex = 0;
    let activeIndex = -1;
    let currentMatches = [];
    const selectedActors = new Set(JSON.parse(localStorage.getItem("selectedActors") || "[]"));
    const movieCache = new Map();
    const actorCache = new Map();

    const init = async () => {
        const res = await fetch(`${API_BASE}/debug`, { credentials: "include" });
        const data = await res.json();
        if (!data.tmdbKeyExists) {
            location.href = "tmdb_key.html";
            return;
        }

        // Restore checkbox states
        nodes.checkboxes.forEach(cb => {
            cb.checked = selectedActors.has(cb.dataset.name);
        });

        handleActorChange();
    };

    /* ================= SEARCH DROPDOWN ================= */
 async function renderDropdown() {
    const q = nodes.input.value.trim();
    const requestId = ++renderRequestId; // 👈 unique id for this call

    nodes.dropdown.innerHTML = "";

    if (!q) {
        nodes.dropdown.style.display = "none";
        currentMatches = [];
        return;
    }

    try {
        let data;

        if (actorCache.has(q.toLowerCase())) {
            data = actorCache.get(q.toLowerCase());
        } else {
            const res = await fetch(
                `${API_BASE}/search/actor?name=${encodeURIComponent(q)}`,
                { credentials: "include" }
            );

            data = await res.json();
            data = Array.isArray(data) ? data : (data.id ? [data] : []);
            actorCache.set(q.toLowerCase(), data);
        }

        // ❗ STOP if this is NOT the latest request
        if (requestId !== renderRequestId) return;

        // ✅ Deduplicate
        currentMatches = [
            ...new Map(
                data.map(actor => [actor.name.toLowerCase(), actor])
            ).values()
        ];

        activeIndex = 0;
        nodes.dropdown.innerHTML = "";

        if (currentMatches.length === 0) {
            const div = document.createElement("div");
            div.className = "suggestion no-result";
            div.innerText = "No actors found";
            nodes.dropdown.appendChild(div);
        } else {
            currentMatches.forEach(actor => {
                const div = document.createElement("div");
                div.className = "suggestion";
                div.innerText = actor.name;
                div.onclick = () => selectActor(actor.name);
                nodes.dropdown.appendChild(div);
            });
        }

        nodes.dropdown.style.display = "block";
        highlightDropdown();

    } catch (e) {
        console.error("Actor search failed", e);
    }
}



    function highlightDropdown() {
        const items = nodes.dropdown.querySelectorAll(".suggestion");
        items.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
        if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: "nearest" });
    }

    function selectActor(name) {
        selectedActors.add(name);
        nodes.input.value = "";
        nodes.dropdown.style.display = "none";
        localStorage.setItem("selectedActors", JSON.stringify([...selectedActors]));
        syncCheckboxes();
        handleActorChange();
    }

    function syncCheckboxes() {
        nodes.checkboxes.forEach(cb => cb.checked = selectedActors.has(cb.dataset.name));
    }

    /* ================= MOVIES FETCH & GALLERY ================= */
    async function fetchMoviesForActor(actorName) {
        if (movieCache.has(actorName)) return movieCache.get(actorName);
        try {
            const actorRes = await fetch(`${API_BASE}/search/actor?name=${encodeURIComponent(actorName)}`, { credentials: "include" });
            const actorData = await actorRes.json();
            if (!actorData.id) return [];
            const movieRes = await fetch(`${API_BASE}/search/actor/movies?id=${actorData.id}&page=1`, { credentials: "include" });
            const movies = await movieRes.json();
            movieCache.set(actorName, movies);
            return movies;
        } catch (e) { return []; }
    }

    async function handleActorChange() {
        renderChips();
        const selected = [...selectedActors];

        if (selected.length === 0) {
            nodes.title.innerText = "POPULAR MOVIES:";
            const res = await fetch(`${API_BASE}/movies/popular`, { credentials: "include" });
            allMovies = await res.json();
        } else {
            nodes.title.innerText = selected.map(n => n.toUpperCase()).join(" & ") + " MOVIES:";
            const results = await Promise.all(selected.map(n => fetchMoviesForActor(n)));

            const seen = new Set();
            allMovies = [];
            const max = Math.max(...results.map(r => r.length));
            for (let i = 0; i < max; i++) {
                for (const list of results) {
                    if (list[i] && !seen.has(list[i].id)) {
                        seen.add(list[i].id);
                        allMovies.push(list[i]);
                    }
                }
                if (allMovies.length >= 60) break;
            }
        }
        currentIndex = 0;
        renderGallery();
    }

    function renderGallery() {
        nodes.gallery.innerHTML = "";
        const fragment = document.createDocumentFragment();
        const slice = allMovies.slice(currentIndex, currentIndex + VISIBLE);

        if (slice.length === 0) {
            nodes.gallery.innerHTML = "<p class='no-results'>No movies found.</p>";
            return;
        }

        slice.forEach(movie => {
            const card = document.createElement("div");
            card.className = "movie-card";
            card.onclick = () => location.href = `movie_details.html?id=${movie.id}`;
            const img = new Image();
            img.src = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : "../static/media/images/default_movie.png";
            img.loading = "lazy";
            card.appendChild(img);
            fragment.appendChild(card);
        });
        nodes.gallery.appendChild(fragment);
    }

    function renderChips() {
        nodes.chips.innerHTML = "";
        selectedActors.forEach(name => {
            const chip = document.createElement("div");
            chip.className = "chip";
            chip.innerHTML = `${name} <span class="close-btn" data-name="${name}">&times;</span>`;
            chip.querySelector(".close-btn").onclick = () => {
                selectedActors.delete(name);
                localStorage.setItem("selectedActors", JSON.stringify([...selectedActors]));
                syncCheckboxes();
                handleActorChange();
            };
            nodes.chips.appendChild(chip);
        });
    }

    /* ================= EVENT LISTENERS ================= */
    nodes.input.addEventListener("input", renderDropdown);

    nodes.input.addEventListener("keydown", e => {
        if (currentMatches.length === 0 || nodes.dropdown.style.display !== "block") return;

        switch (e.key) {
            case "ArrowDown":
                activeIndex = (activeIndex + 1) % currentMatches.length;
                highlightDropdown();
                e.preventDefault();
                break;
            case "ArrowUp":
                activeIndex = (activeIndex - 1 + currentMatches.length) % currentMatches.length;
                highlightDropdown();
                e.preventDefault();
                break;
            case "Enter":
                if (currentMatches[activeIndex]) selectActor(currentMatches[activeIndex].name);
                e.preventDefault();
                break;
            case "Escape":
                nodes.dropdown.style.display = "none";
                break;
        }
    });

    document.addEventListener("click", e => {
        if (!e.target.closest(".select-box")) nodes.dropdown.style.display = "none";
    });

    nodes.checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const name = cb.dataset.name;
            if (cb.checked) selectedActors.add(name);
            else selectedActors.delete(name);
            localStorage.setItem("selectedActors", JSON.stringify([...selectedActors]));
            handleActorChange();
        });
    });

    nodes.btnRight?.addEventListener("click", () => {
        currentIndex = Math.min(currentIndex + VISIBLE, allMovies.length - VISIBLE);
        renderGallery();
    });

    nodes.btnLeft?.addEventListener("click", () => {
        currentIndex = Math.max(currentIndex - VISIBLE, 0);
        renderGallery();
    });

    init();
});
