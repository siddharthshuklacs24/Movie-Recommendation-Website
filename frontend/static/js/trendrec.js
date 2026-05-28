document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE = `${location.protocol}//${location.hostname}:8000`;
    const VISIBLE = 5;

    const galleries = document.querySelectorAll(".movie-gallery");

    async function fetchMovies(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            credentials: "include"
        });
        return await res.json();
    }

    function setupGallery(gallery, movies) {
        const container = gallery.querySelector(".scroll-container");
        const btnLeft = gallery.querySelector(".scroll-btn.left");
        const btnRight = gallery.querySelector(".scroll-btn.right");

        let index = 0;

        function render() {
            container.innerHTML = "";

            const slice = movies.slice(index, index + VISIBLE);

            if (slice.length === 0) {
                container.innerHTML = "<p class='no-results'>No movies found</p>";
                return;
            }

            slice.forEach(movie => {
                const card = document.createElement("div");
                card.className = "movie-card";

                card.onclick = () => {
                    location.href = `movie_details.html?id=${movie.id}`;
                };

                const img = new Image();
                img.loading = "lazy";
                img.src = movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : "../static/media/images/default_movie.png";

                card.appendChild(img);
                container.appendChild(card);
            });
        }

        btnRight.addEventListener("click", () => {
            index = Math.min(index + VISIBLE, movies.length - VISIBLE);
            render();
        });

        btnLeft.addEventListener("click", () => {
            index = Math.max(0, index - VISIBLE);
            render();
        });

        render();
    }

    // Initialize both sections
    for (const gallery of galleries) {
        const title = gallery.querySelector(".gallery-title").innerText;

        if (title.includes("TRENDING")) {
            const movies = await fetchMovies("/movies/trending");
            setupGallery(gallery, movies);
        }

        if (title.includes("RECENT")) {
            const movies = await fetchMovies("/movies/recent");
            setupGallery(gallery, movies);
        }
    }
});
