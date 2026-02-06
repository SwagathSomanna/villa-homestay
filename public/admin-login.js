// admin-login.js

const API_BASE_URL = "http://localhost:4000/api";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginAlert = document.getElementById("loginAlert");

function showAlert(message, type = "error") {
  loginAlert.textContent = message;
  loginAlert.className = `alert ${type}`;
  setTimeout(() => {
    loginAlert.className = "alert hidden";
  }, 5000);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showAlert("Please enter both username and password");
    return;
  }

  // Show loading
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store username in localStorage
      localStorage.setItem("adminUsername", username);

      showAlert("Login successful! Redirecting...", "success");

      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 1000);
    } else {
      showAlert(data.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    showAlert("Connection error. Please try again.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});

// Check if already logged in
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
      credentials: "include",
    });

    if (response.ok) {
      // Already logged in, redirect to dashboard
      window.location.href = "admin.html";
    }
  } catch (error) {
    // Not logged in, stay on login page
  }
}

checkAuth();
