const registerForm = document.getElementById("registerForm");


const username = document.getElementById("username");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");



registerForm.addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission
    const registerData = {
        usernameFromInput: username.value,
        emailFromInput: email.value,
        phoneFromInput: phone.value,
        passwordFromInput: password.value,
        confirmPasswordFromInput: confirmPassword.value
    };

    if (/\d/.test(username.value)) {
        alert("Username cannot contain numbers.");
        return; // stop submission
    }

    if (/\D/.test(phone.value)) {
        alert("Phone number must contain only digits.");
        return;
    }

    console.log("Registering with:", registerData);

    try {
        const response = await fetch("http://localhost:8000/account/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registerData),
            credentials: "include"
        });

        const data = await response.json();

    if (response.ok) {
        console.log("Login Successful:", data);
        window.location.href = "../templates/login.html";
    } else {
        console.error("Login error:", data);
        alert("Error: " + (data.error || "Login failed"));
    }
    } catch (error) {
        console.error("Request failed:", error);
        alert("Error: " + error);
    }
});