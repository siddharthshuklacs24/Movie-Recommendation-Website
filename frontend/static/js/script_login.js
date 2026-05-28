const username = document.getElementById("username");
const password = document.getElementById("password");
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault(); 

    const loginData = {
        usernameFromInput: username.value,
        passwordFromInput: password.value
    };

    try {
        // ✅ MATCHED: Using 127.0.0.1 to match your browser's address
        const response = await fetch("http://127.0.0.1:8000/account/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", username.value);
            localStorage.setItem("user_id", data.user_id); 
            window.location.href = "homepage.html"; // Adjust path if needed
        } else {
            alert("Error: " + (data.error || "Login failed"));
        }
    } catch (error) {
        console.error("Request failed:", error);
        alert("Failed to connect to backend. Make sure you RESTARTED the server after changing CORS!");
    }
});