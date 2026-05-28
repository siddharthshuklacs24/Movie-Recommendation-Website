const form = document.getElementById("tmdbForm");
const apiKeyInput = document.getElementById("tmdbKey");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return;

  status.textContent = "Saving...";
  status.className = "";

  try {
    const response = await fetch(
      `${location.protocol}//${location.hostname}:8000/tmdb/key`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      status.textContent = data.error || "Invalid API key";
      status.classList.add("error");
      return;
    }

    status.textContent = "TMDB key saved successfully";
    status.classList.add("success");

    const redirect =
      localStorage.getItem("redirectAfterTMDB") || "genre.html";

    localStorage.removeItem("redirectAfterTMDB");

    setTimeout(() => {
      window.location.href = redirect;
    }, 800);

  } catch (err) {
    status.textContent = "Server not reachable";
    status.classList.add("error");
  }
});
