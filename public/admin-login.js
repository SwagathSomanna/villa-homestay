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

// Custom cursor – same effect as main page
function initCustomCursor() {
  const hasFinPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasFinPointer) return;

  const cursorDot = document.querySelector(".pointer-dot");
  const cursorGlow = document.querySelector(".pointer-glow");
  const cursorTrail = document.querySelector(".pointer-trail");
  if (!cursorDot || !cursorGlow || !cursorTrail) return;

  document.body.classList.add("custom-cursor-enabled");
  let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + "px";
    cursorDot.style.top = mouseY + "px";
    cursorGlow.style.left = mouseX + "px";
    cursorGlow.style.top = mouseY + "px";
  });

  function animateTrail() {
    trailX += (mouseX - trailX) * 0.1;
    trailY += (mouseY - trailY) * 0.1;
    cursorTrail.style.left = trailX + "px";
    cursorTrail.style.top = trailY + "px";
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  const interactive = "a, button, input, select, label";
  document.addEventListener("mouseenter", (e) => {
    if (e.target.matches(interactive)) cursorGlow.classList.add("active");
  }, true);
  document.addEventListener("mouseleave", (e) => {
    if (e.target.matches(interactive)) cursorGlow.classList.remove("active");
  }, true);
}

// Password visibility toggle (icon inside field)
const togglePasswordBtn = document.getElementById("togglePasswordVisibility");
const iconShow = togglePasswordBtn?.querySelector(".icon-show");
const iconHide = togglePasswordBtn?.querySelector(".icon-hide");
if (passwordInput && togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePasswordBtn.setAttribute("aria-label", "Hide password");
      if (iconShow) iconShow.classList.add("hidden");
      if (iconHide) iconHide.classList.remove("hidden");
    } else {
      passwordInput.type = "password";
      togglePasswordBtn.setAttribute("aria-label", "Show password");
      if (iconShow) iconShow.classList.remove("hidden");
      if (iconHide) iconHide.classList.add("hidden");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { checkAuth(); initCustomCursor(); });
} else {
  checkAuth();
  initCustomCursor();
}
