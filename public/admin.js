const authForm = document.getElementById('adminAuthForm');
const pinInput = document.getElementById('adminPin');
const panels = document.getElementById('adminPanels');
const authCard = document.getElementById('adminAuthCard');

const pointerDot = document.querySelector('.pointer-dot');
const pointerGlow = document.querySelector('.pointer-glow');
const pointerTrail = document.querySelector('.pointer-trail');
const interactiveSelectors = 'a, button, .chip, input, select, label, [role="button"]';

/* ---------- Custom cursor ---------- */
if (pointerDot && pointerGlow && pointerTrail) {
  const cursorState = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    glowX: window.innerWidth / 2,
    glowY: window.innerHeight / 2,
    trailX: window.innerWidth / 2,
    trailY: window.innerHeight / 2,
    isOverInteractive: false
  };

  document.addEventListener('mousemove', (e) => {
    pointerDot.style.left = `${e.clientX}px`;
    pointerDot.style.top = `${e.clientY}px`;
    cursorState.targetX = e.clientX;
    cursorState.targetY = e.clientY;

    // Check if pointer is over interactive element
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    const isInteractive = elementBelow && (
      elementBelow.matches(interactiveSelectors) ||
      elementBelow.closest(interactiveSelectors)
    );
    cursorState.isOverInteractive = !!isInteractive;
    
    if (isInteractive) {
      pointerGlow.classList.add('active');
    } else {
      pointerGlow.classList.remove('active');
    }
  });

  function animateGlow() {
    cursorState.glowX += (cursorState.targetX - cursorState.glowX) * 0.18;
    cursorState.glowY += (cursorState.targetY - cursorState.glowY) * 0.18;
    cursorState.trailX += (cursorState.targetX - cursorState.trailX) * 0.08;
    cursorState.trailY += (cursorState.targetY - cursorState.trailY) * 0.08;
    pointerGlow.style.left = `${cursorState.glowX}px`;
    pointerGlow.style.top = `${cursorState.glowY}px`;
    pointerTrail.style.left = `${cursorState.trailX}px`;
    pointerTrail.style.top = `${cursorState.trailY}px`;
    requestAnimationFrame(animateGlow);
  }

  animateGlow();
}

function showAdmin(loggedIn) {
  panels.classList.toggle('hidden', !loggedIn);
  authCard.classList.toggle('hidden', loggedIn);
}

async function login(pin) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
}

async function checkSession() {
  const res = await fetch('/api/admin/overview', {
    credentials: 'include'
  });

  return res.ok;
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    await login(pinInput.value.trim());
    showAdmin(true);
  } catch (err) {
    alert(err.message);
    showAdmin(false);
  }
});

// Initial load — silent check
(async () => {
  const ok = await checkSession();
  showAdmin(ok);
})();
