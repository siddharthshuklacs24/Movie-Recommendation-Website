document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE = `${location.protocol}//${location.hostname}:8000`;
    const VISIBLE = 5;

    const nodes = {
        input: document.querySelector(".genre-input"),
        dropdown: document.querySelector(".genre-suggestions"),
        chips: document.getElementById("selectedChips"),
        checkboxes: document.querySelectorAll(".tags-container input[type=checkbox]"),
        gallery: document.querySelector(".scroll-container"),
        title: document.querySelector(".gallery-title"),
        btnRight: document.querySelector(".scroll-btn.right"),
        btnLeft: document.querySelector(".scroll-btn.left")
    };

    const GENRES = [
        "Action","Adventure","Animation","Comedy","Crime","Documentary","Drama",
        "Family","Fantasy","History","Horror","Music","Mystery","Romance",
        "Science Fiction","TV Movie","Thriller","War","Western"
    ];

    let allMovies = [];
    let currentIndex = 0;
    let activeIndex = -1;
    let currentMatches = [];
    const selectedGenres = new Set(JSON.parse(localStorage.getItem("selectedGenres") || "[]"));
    const movieCache = new Map();

    const init = async () => {
        const res = await fetch(`${API_BASE}/debug`, { credentials: "include" });
        const data = await res.json();
        if (!data.tmdbKeyExists) {
            location.href = "tmdb_key.html";
            return;
        }

        // Restore checkbox states
        nodes.checkboxes.forEach(cb => {
            if (selectedGenres.has(cb.id.toLowerCase())) cb.checked = true;
        });

        handleGenreChange();
    };

    async function fetchMoviesForGenre(genre) {
        const lowerG = genre.toLowerCase();
        if (movieCache.has(lowerG)) return movieCache.get(lowerG);

        const pages = [1,2,3];
        const results = await Promise.all(pages.map(p =>
            fetch(`${API_BASE}/search/genre?genre=${encodeURIComponent(genre)}&page=${p}`, { credentials: "include" })
            .then(r => r.json())
        ));
        const flat = results.flat().filter(m => m && m.id);
        movieCache.set(lowerG, flat);
        return flat;
    }

    async function handleGenreChange() {
        currentIndex = 0;
        renderChips();
        const selected = [...selectedGenres];

        if (selected.length === 0) {
            nodes.title.innerText = "POPULAR MOVIES:";
            const res = await fetch(`${API_BASE}/movies/popular`, { credentials: "include" });
            allMovies = await res.json();
        } else {
            nodes.title.innerText = selected.map(s => s.toUpperCase()).join(" / ") + " MOVIES:";
            const genreResults = await Promise.all(selected.map(g => fetchMoviesForGenre(g)));
            const seen = new Set();
            allMovies = [];
            const maxLen = Math.max(...genreResults.map(r => r.length));
            for (let i = 0; i < maxLen; i++) {
                for (const list of genreResults) {
                    if (list[i] && !seen.has(list[i].id)) {
                        seen.add(list[i].id);
                        allMovies.push(list[i]);
                    }
                }
                if (allMovies.length >= 60) break;
            }
        }
        renderGallery();
    }

    function renderGallery() {
        nodes.gallery.innerHTML = "";
        const slice = allMovies.slice(currentIndex, currentIndex + VISIBLE);
        if (slice.length === 0) {
            nodes.gallery.innerHTML = "<p class='no-results'>No movies found.</p>";
            return;
        }
        const frag = document.createDocumentFragment();
        slice.forEach(m => {
            const card = document.createElement("div");
            card.className = "movie-card";
            card.onclick = () => location.href = `movie_details.html?id=${m.id}`;
            const img = new Image();
            img.src = m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : "../static/media/images/default_movie.png";
            img.loading = "lazy";
            card.appendChild(img);
            frag.appendChild(card);
        });
        nodes.gallery.appendChild(frag);
    }

    function renderChips() {
        nodes.chips.innerHTML = "";
        selectedGenres.forEach(genre => {
            const chip = document.createElement("div");
            chip.className = "chip";
            chip.innerHTML = `${genre} <span class="close-btn" data-genre="${genre}">&times;</span>`;
            chip.querySelector(".close-btn").onclick = e => {
                selectedGenres.delete(e.target.dataset.genre);
                localStorage.setItem("selectedGenres", JSON.stringify([...selectedGenres]));
                syncCheckboxes();
                handleGenreChange();
            };
            nodes.chips.appendChild(chip);
        });
    }

    function renderDropdown() {
    const q = nodes.input.value.trim().toLowerCase();
    nodes.dropdown.innerHTML = "";

    if (!q) {
        nodes.dropdown.style.display = "none";
        return;
    }

    currentMatches = [...new Set(
        GENRES.filter(g => g.toLowerCase().includes(q))
    )];

    if (currentMatches.length === 0) {
        nodes.dropdown.innerHTML =
            '<div class="genre-suggestion no-result">No genres found</div>';
    } else {
        currentMatches.forEach(g => {
            const div = document.createElement("div");
            div.className = "genre-suggestion";
            div.innerText = g;
            div.onclick = () => selectGenre(g);
            nodes.dropdown.appendChild(div);
        });
    }

    nodes.dropdown.style.display = "block";
    activeIndex = 0;
    highlight();
}


    function highlight() {
        const items = nodes.dropdown.querySelectorAll(".genre-suggestion");
        items.forEach((el,i)=>el.classList.toggle("active",i===activeIndex));
        if(items[activeIndex]) items[activeIndex].scrollIntoView({block:"nearest"});
    }

    function selectGenre(name){
        selectedGenres.add(name.toLowerCase());
        localStorage.setItem("selectedGenres", JSON.stringify([...selectedGenres]));
        nodes.input.value="";
        nodes.dropdown.style.display="none";
        syncCheckboxes();
        handleGenreChange();
    }

    function syncCheckboxes(){
        nodes.checkboxes.forEach(cb => cb.checked = selectedGenres.has(cb.id.toLowerCase()));
    }

    /* ================= EVENT LISTENERS ================= */
    nodes.input.addEventListener("input", renderDropdown);
    nodes.input.addEventListener("keydown", e=>{
        if(nodes.dropdown.style.display!=="block") return;
        if(e.key==="ArrowDown"){ activeIndex=(activeIndex+1)%currentMatches.length; highlight(); e.preventDefault(); }
        if(e.key==="ArrowUp"){ activeIndex=(activeIndex-1+currentMatches.length)%currentMatches.length; highlight(); e.preventDefault(); }
        if(e.key==="Enter"){ if(currentMatches[activeIndex]) selectGenre(currentMatches[activeIndex]); e.preventDefault(); }
        if(e.key==="Escape") nodes.dropdown.style.display="none";
    });

    document.addEventListener("click", e=>{
        if(!e.target.closest(".genre-box")) nodes.dropdown.style.display="none";
    });

    nodes.checkboxes.forEach(cb=>{
        cb.addEventListener("change",()=>{
            if(cb.checked) selectedGenres.add(cb.id.toLowerCase());
            else selectedGenres.delete(cb.id.toLowerCase());
            localStorage.setItem("selectedGenres", JSON.stringify([...selectedGenres]));
            handleGenreChange();
        });
    });

    nodes.btnRight?.addEventListener("click",()=>{
        currentIndex=Math.min(currentIndex+VISIBLE, allMovies.length-VISIBLE);
        renderGallery();
    });
    nodes.btnLeft?.addEventListener("click",()=>{
        currentIndex=Math.max(0,currentIndex-VISIBLE);
        renderGallery();
    });

    init();
});
