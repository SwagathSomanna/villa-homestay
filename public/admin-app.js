// admin-app.js

// ============================================================================
// CONFIG & API BASE URL
// ============================================================================
const API_BASE_URL = "http://localhost:4000/api";

// ============================================================================
// AUTHENTICATION CHECK
// ============================================================================
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
      credentials: "include",
    });

    if (!response.ok) {
      // Not authenticated, redirect to login
      window.location.href = "admin-login.html";
      return false;
    }

    // Display username
    const username = localStorage.getItem("adminUsername") || "Admin";
    document.getElementById("adminUsername").textContent = username;

    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "admin-login.html";
    return false;
  }
}

//logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    console.log(";ogout clocked");
    await fetch(`${API_BASE_URL}/admin/logout`, {
      method: "POST", // better than GET for logout
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout failed", err);
  }

  window.location.replace("index.html");
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function showAlert(message, type = "success") {
  const alert = document.getElementById("adminAlert");
  alert.textContent = message;
  alert.className = `alert ${type}`;

  setTimeout(() => {
    alert.className = "alert hidden";
  }, 5000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getBookingTypeText(booking) {
  if (booking.targetType === "villa") return "Entire Villa";
  if (booking.targetType === "floor") {
    return booking.floorId === "F1" ? "Ground Floor" : "Top Floor";
  }
  const roomNames = {
    R1: "Robusta",
    R2: "Arabica",
    R3: "Excelsa",
    R4: "Liberica",
  };
  return roomNames[booking.roomId] || booking.roomId;
}

// ============================================================================
// TAB SWITCHING
// ============================================================================
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetTab = button.dataset.tab;

    // Update active button
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Update active content
    tabContents.forEach((content) => {
      content.classList.remove("active");
    });

    const targetContent = document.getElementById(`${targetTab}Tab`);
    if (targetContent) {
      targetContent.classList.add("active");
    }

    // Load data for the active tab
    if (targetTab === "bookings") {
      loadBookings();
    } else if (targetTab === "pricing") {
      loadPricingRules();
    }
  });
});

// ============================================================================
// BOOKINGS MANAGEMENT
// ============================================================================
let allBookings = [];
let currentStatusFilter = "all";

async function loadBookings() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch bookings");

    allBookings = await response.json();
    updateStats();
    renderBookings();
  } catch (error) {
    console.error("Error loading bookings:", error);
    showAlert("Failed to load bookings", "error");
  }
}

function updateStats() {
  const total = allBookings.length;
  const paid = allBookings.filter((b) => b.status === "paid").length;
  const pending = allBookings.filter((b) => b.status === "pending").length;
  const blocked = allBookings.filter((b) => b.status === "blocked").length;

  document.getElementById("totalBookings").textContent = total;
  document.getElementById("paidBookings").textContent = paid;
  document.getElementById("pendingBookings").textContent = pending;
  document.getElementById("blockedDates").textContent = blocked;
}

function renderBookings() {
  const tbody = document.getElementById("bookingsTableBody");

  // Filter bookings based on status
  let filteredBookings = allBookings;
  if (currentStatusFilter !== "all") {
    filteredBookings = allBookings.filter(
      (b) => b.status === currentStatusFilter,
    );
  }

  if (filteredBookings.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center">No bookings found</td></tr>';
    return;
  }

  // Sort by check-in date (most recent first)
  filteredBookings.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  tbody.innerHTML = filteredBookings
    .map((booking) => {
      const guestName = booking.guest?.name || "N/A";
      const adults = booking.guest?.adults || 0;
      const children = booking.guest?.children || 0;
      const total = booking.pricing?.totalPrice || 0;

      return `
      <tr>
        <td>
          <strong>${guestName}</strong>
          ${booking.guest?.email ? `<br><small>${booking.guest.email}</small>` : ""}
        </td>
        <td>${getBookingTypeText(booking)}</td>
        <td>${formatDate(booking.checkIn)}</td>
        <td>${formatDate(booking.checkOut)}</td>
        <td>${adults}A ${children > 0 ? `+ ${children}C` : ""}</td>
        <td><span class="badge ${booking.status}">${booking.status}</span></td>
        <td>${formatCurrency(total)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn success" onclick="editBooking('${booking._id}')">Edit</button>
            <button class="btn danger" onclick="deleteBooking('${booking._id}', '${guestName}')">Cancel</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Status filter
document.getElementById("statusFilter").addEventListener("change", (e) => {
  currentStatusFilter = e.target.value;
  renderBookings();
});

// ============================================================================
// EDIT BOOKING
// ============================================================================
window.editBooking = function (bookingId) {
  const booking = allBookings.find((b) => b._id === bookingId);
  if (!booking) return;

  // Populate edit form
  document.getElementById("editBookingId").value = booking._id;
  document.getElementById("editStatus").value = booking.status;
  document.getElementById("editCheckIn").value = booking.checkIn.split("T")[0];
  document.getElementById("editCheckOut").value =
    booking.checkOut.split("T")[0];

  // Show modal
  showModal("editBookingModal");
};

document
  .getElementById("editBookingForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const bookingId = document.getElementById("editBookingId").value;
    const status = document.getElementById("editStatus").value;
    const checkIn = document.getElementById("editCheckIn").value;
    const checkOut = document.getElementById("editCheckOut").value;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/bookings/${bookingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status, checkIn, checkOut }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        showAlert("Booking updated successfully");
        hideModal("editBookingModal");
        loadBookings();
      } else {
        showAlert(data.message || "Failed to update booking", "error");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      showAlert("Failed to update booking", "error");
    }
  });

// ============================================================================
// DELETE BOOKING
// ============================================================================
window.deleteBooking = async function (bookingId, guestName) {
  if (
    !confirm(`Are you sure you want to cancel the booking for ${guestName}?`)
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/bookings/${bookingId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (response.ok) {
      showAlert("Booking cancelled successfully");
      loadBookings();
    } else {
      showAlert(data.message || "Failed to cancel booking", "error");
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    showAlert("Failed to cancel booking", "error");
  }
};

// ============================================================================
// PRICING RULES MANAGEMENT
// ============================================================================
let allPricingRules = [];

async function loadPricingRules() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pricing-rules`, {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch pricing rules");

    allPricingRules = await response.json();
    renderPricingRules();
  } catch (error) {
    console.error("Error loading pricing rules:", error);
    showAlert("Failed to load pricing rules", "error");
  }
}

function renderPricingRules() {
  const tbody = document.getElementById("pricingRulesTableBody");

  if (allPricingRules.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center">No pricing rules found. Create your first rule!</td></tr>';
    return;
  }

  tbody.innerHTML = allPricingRules
    .map((rule) => {
      const daysText =
        rule.daysOfWeek && rule.daysOfWeek.length > 0
          ? getDaysOfWeekText(rule.daysOfWeek)
          : "All days";

      const appliesText = getAppliesText(rule);
      const modifierText =
        rule.modifierType === "percentage"
          ? `${rule.modifierValue > 0 ? "+" : ""}${rule.modifierValue}%`
          : `${rule.modifierValue > 0 ? "+" : ""}${formatCurrency(rule.modifierValue)}`;

      return `
      <tr>
        <td>
          <strong>${rule.name}</strong>
          ${rule.description ? `<br><small>${rule.description}</small>` : ""}
        </td>
        <td>${appliesText}</td>
        <td>
          ${formatDate(rule.startDate)}<br>
          <small>to</small><br>
          ${formatDate(rule.endDate)}
        </td>
        <td><span class="badge ${rule.modifierValue >= 0 ? "success" : "danger"}">${modifierText}</span></td>
        <td><small>${daysText}</small></td>
        <td>${rule.priority}</td>
        <td><span class="badge ${rule.isActive ? "active" : "inactive"}">${rule.isActive ? "Active" : "Inactive"}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn success" onclick="editPricingRule('${rule._id}')">Edit</button>
            <button class="btn ${rule.isActive ? "warning" : "success"}" onclick="togglePricingRule('${rule._id}', ${!rule.isActive})">
              ${rule.isActive ? "Deactivate" : "Activate"}
            </button>
            <button class="btn danger" onclick="deletePricingRule('${rule._id}', '${rule.name}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

function getDaysOfWeekText(days) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d]).join(", ");
}

function getAppliesText(rule) {
  if (rule.appliesTo === "all") return "All (Villa, Floors & Rooms)";
  if (rule.appliesTo === "villa") return "Entire Villa";
  if (rule.appliesTo === "floor") {
    const floorName =
      rule.targetFloorId === "F1" ? "Ground Floor" : "Top Floor";
    return `Floor: ${floorName}`;
  }
  if (rule.appliesTo === "room") {
    const roomNames = {
      R1: "Robusta",
      R2: "Arabica",
      R3: "Excelsa",
      R4: "Liberica",
    };
    return `Room: ${roomNames[rule.targetRoomId]}`;
  }
  return rule.appliesTo;
}

// ============================================================================
// ADD/EDIT PRICING RULE
// ============================================================================
document.getElementById("addPricingRuleBtn").addEventListener("click", () => {
  // Clear form
  document.getElementById("pricingRuleForm").reset();
  document.getElementById("pricingRuleId").value = "";
  document.getElementById("pricingRuleModalTitle").textContent =
    "Add Pricing Rule";

  // Uncheck all day checkboxes
  document
    .querySelectorAll(".day-checkbox")
    .forEach((cb) => (cb.checked = false));

  // Hide target selects
  document.getElementById("ruleFloorGroup").classList.add("hidden");
  document.getElementById("ruleRoomGroup").classList.add("hidden");

  showModal("pricingRuleModal");
});

window.editPricingRule = function (ruleId) {
  const rule = allPricingRules.find((r) => r._id === ruleId);
  if (!rule) return;

  // Populate form
  document.getElementById("pricingRuleId").value = rule._id;
  document.getElementById("ruleName").value = rule.name;
  document.getElementById("ruleDescription").value = rule.description || "";
  document.getElementById("ruleStartDate").value = rule.startDate.split("T")[0];
  document.getElementById("ruleEndDate").value = rule.endDate.split("T")[0];
  document.getElementById("ruleAppliesTo").value = rule.appliesTo;
  document.getElementById("ruleModifierType").value = rule.modifierType;
  document.getElementById("ruleModifierValue").value = rule.modifierValue;
  document.getElementById("rulePriority").value = rule.priority;

  // Show/hide target selects based on appliesTo
  updatePricingRuleTargetVisibility(rule.appliesTo);

  if (rule.targetFloorId) {
    document.getElementById("ruleTargetFloor").value = rule.targetFloorId;
  }
  if (rule.targetRoomId) {
    document.getElementById("ruleTargetRoom").value = rule.targetRoomId;
  }

  // Check appropriate days
  document.querySelectorAll(".day-checkbox").forEach((cb) => {
    cb.checked =
      rule.daysOfWeek && rule.daysOfWeek.includes(parseInt(cb.value));
  });

  document.getElementById("pricingRuleModalTitle").textContent =
    "Edit Pricing Rule";
  showModal("pricingRuleModal");
};

// Update target visibility when "Applies To" changes
document.getElementById("ruleAppliesTo").addEventListener("change", (e) => {
  updatePricingRuleTargetVisibility(e.target.value);
});

function updatePricingRuleTargetVisibility(appliesTo) {
  const floorGroup = document.getElementById("ruleFloorGroup");
  const roomGroup = document.getElementById("ruleRoomGroup");

  if (appliesTo === "floor") {
    floorGroup.classList.remove("hidden");
    roomGroup.classList.add("hidden");
  } else if (appliesTo === "room") {
    roomGroup.classList.remove("hidden");
    floorGroup.classList.add("hidden");
  } else {
    floorGroup.classList.add("hidden");
    roomGroup.classList.add("hidden");
  }
}

// Update modifier help text
document.getElementById("ruleModifierType").addEventListener("change", (e) => {
  const helpText = document.getElementById("modifierHelp");
  if (e.target.value === "percentage") {
    helpText.textContent = "(e.g., 30 for +30%, -15 for -15%)";
  } else {
    helpText.textContent = "(e.g., 5000 for +₹5000, -1000 for -₹1000)";
  }
});

// Submit pricing rule form
document
  .getElementById("pricingRuleForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const ruleId = document.getElementById("pricingRuleId").value;
    const isEdit = !!ruleId;

    // Collect days of week
    const daysOfWeek = Array.from(
      document.querySelectorAll(".day-checkbox:checked"),
    ).map((cb) => parseInt(cb.value));

    const ruleData = {
      name: document.getElementById("ruleName").value.trim(),
      description: document.getElementById("ruleDescription").value.trim(),
      startDate: document.getElementById("ruleStartDate").value,
      endDate: document.getElementById("ruleEndDate").value,
      appliesTo: document.getElementById("ruleAppliesTo").value,
      modifierType: document.getElementById("ruleModifierType").value,
      modifierValue: parseFloat(
        document.getElementById("ruleModifierValue").value,
      ),
      daysOfWeek: daysOfWeek,
      priority: parseInt(document.getElementById("rulePriority").value),
    };

    // Add target floor/room if applicable
    if (ruleData.appliesTo === "floor") {
      ruleData.targetFloorId = document.getElementById("ruleTargetFloor").value;
    } else if (ruleData.appliesTo === "room") {
      ruleData.targetRoomId = document.getElementById("ruleTargetRoom").value;
    }

    try {
      const url = isEdit
        ? `${API_BASE_URL}/admin/pricing-rules/${ruleId}`
        : `${API_BASE_URL}/admin/pricing-rules`;

      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(ruleData),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(
          isEdit
            ? "Pricing rule updated successfully"
            : "Pricing rule created successfully",
        );
        hideModal("pricingRuleModal");
        loadPricingRules();
      } else {
        showAlert(data.message || "Failed to save pricing rule", "error");
      }
    } catch (error) {
      console.error("Error saving pricing rule:", error);
      showAlert("Failed to save pricing rule", "error");
    }
  });

// ============================================================================
// TOGGLE PRICING RULE
// ============================================================================
window.togglePricingRule = async function (ruleId, activate) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/pricing-rules/${ruleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isActive: activate }),
      },
    );

    const data = await response.json();

    if (response.ok) {
      showAlert(
        `Pricing rule ${activate ? "activated" : "deactivated"} successfully`,
      );
      loadPricingRules();
    } else {
      showAlert(data.message || "Failed to toggle pricing rule", "error");
    }
  } catch (error) {
    console.error("Error toggling pricing rule:", error);
    showAlert("Failed to toggle pricing rule", "error");
  }
};

// ============================================================================
// DELETE PRICING RULE
// ============================================================================
window.deletePricingRule = async function (ruleId, ruleName) {
  if (
    !confirm(`Are you sure you want to delete the pricing rule "${ruleName}"?`)
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/pricing-rules/${ruleId}?permanent=true`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (response.ok) {
      showAlert("Pricing rule deleted successfully");
      loadPricingRules();
    } else {
      showAlert(data.message || "Failed to delete pricing rule", "error");
    }
  } catch (error) {
    console.error("Error deleting pricing rule:", error);
    showAlert("Failed to delete pricing rule", "error");
  }
};

// ============================================================================
// BLOCK DATES
// ============================================================================
const blockTargetType = document.getElementById("blockTargetType");
const blockFloorGroup = document.getElementById("blockFloorGroup");
const blockRoomGroup = document.getElementById("blockRoomGroup");

blockTargetType.addEventListener("change", (e) => {
  const type = e.target.value;

  if (type === "floor") {
    blockFloorGroup.classList.remove("hidden");
    blockRoomGroup.classList.add("hidden");
  } else if (type === "room") {
    blockRoomGroup.classList.remove("hidden");
    blockFloorGroup.classList.add("hidden");
  } else {
    blockFloorGroup.classList.add("hidden");
    blockRoomGroup.classList.add("hidden");
  }
});

document
  .getElementById("blockDatesForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const blockData = {
      targetType: document.getElementById("blockTargetType").value,
      checkIn: document.getElementById("blockStartDate").value,
      checkOut: document.getElementById("blockEndDate").value,
      reason:
        document.getElementById("blockReason").value.trim() || "Admin blocked",
    };

    if (blockData.targetType === "floor") {
      blockData.floorId = document.getElementById("blockFloorId").value;
    } else if (blockData.targetType === "room") {
      blockData.roomId = document.getElementById("blockRoomId").value;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/blocked-dates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(blockData),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert("Dates blocked successfully");
        document.getElementById("blockDatesForm").reset();
        loadBookings(); // Refresh to show new blocked booking
      } else {
        showAlert(data.message || "Failed to block dates", "error");
      }
    } catch (error) {
      console.error("Error blocking dates:", error);
      showAlert("Failed to block dates", "error");
    }
  });

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("show");
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }
}

// Close modal buttons
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const modalId = e.target.dataset.close;
    hideModal(modalId);
  });
});

// Close modal when clicking backdrop
document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (e) => {
    const modal = e.target.closest(".modal");
    if (modal) {
      hideModal(modal.id);
    }
  });
});

// ============================================================================
// INITIALIZATION
// ============================================================================
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

  const interactive = "a, button, input, select, .tab-btn, .close-modal";
  document.addEventListener("mouseenter", (e) => {
    if (e.target.matches(interactive)) cursorGlow.classList.add("active");
  }, true);
  document.addEventListener("mouseleave", (e) => {
    if (e.target.matches(interactive)) cursorGlow.classList.remove("active");
  }, true);
}

async function initAdmin() {
  initCustomCursor();

  // Check authentication
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  // Load initial data
  await loadBookings();

  // Set minimum dates for block form
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
  document.getElementById("blockStartDate").min = minDate;
  document.getElementById("blockEndDate").min = minDate;

  // Set minimum dates for pricing rules
  document.getElementById("ruleStartDate").min = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("ruleEndDate").min = new Date()
    .toISOString()
    .split("T")[0];
}

// Re-validate auth when page is restored from back-forward cache
window.addEventListener("pageshow", (e) => {
  if (e.persisted) checkAuth();
});

// Start the admin panel
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdmin);
} else {
  initAdmin();
}
