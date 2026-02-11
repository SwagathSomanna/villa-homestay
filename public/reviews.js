const grid = document.getElementById('reviewsGrid');

// Static reviews (jumbled order), font/styling applied via CSS
const REVIEWS = [
  {
    source: 'Airbnb',
    rating: 5,
    text: 'A wonderful place. Deena and her family make the stay so wonderful with their hospitality and warmth. The food is homely and tastes quite good. The room was so spacious and clean. Overall a memorable stay :)',
    author: 'Ekta',
  },
  {
    source: 'Google',
    rating: 5,
    text: 'AnuDina Homestay – Highly Recommended! Had a great stay at AnuDina Homestay. The property is beautifully surrounded by greenery, coffee plantation and pond in mid, giving a very peaceful and refreshing vibe. Host Dina was extremely polite and very responsive, making the stay even more comfortable. The rooms and bathrooms were clean and tidy, and the overall property is very well maintained. A lovely bonus was getting fresh coffee powder made from their own farm beans — a wonderful touch!',
    author: 'Nishanth Singh',
  },
  {
    source: 'Google',
    rating: 5,
    text: 'A very peaceful homestay nestled in the middle of a coffee estate. Loved the calm atmosphere and the amazing coffee prepared by the owner. Being welcomed by Romeo the beagle and two cute cats made the stay even better. Highly recommended for a relaxing getaway.',
    author: 'Sandeep',
  },
  {
    source: 'Google',
    rating: 5,
    text: 'The property is very nice and clean. It is in middle of coffe plantation, very beautiful and peaceful location. The host is very polite and helpful. I really liked the stay. Highly Recommend both bachelor and family to visit this place.',
    author: 'Surbhi Gupta',
  },
  {
    source: 'Airbnb',
    rating: 5,
    text: 'The host was very friendly and helpfull. She lives near the property so easy to get any sort of help. The food provided was also nice if you want to try local food.',
    author: 'Joyati',
  },
  {
    source: 'Google',
    rating: 5,
    text: 'The Destination, Food and Stay is so beautiful and it was a peaceful stay .. i spent much time in this estate and was mesmerised with the lush greenery view... Beautiful weather...Home cooked food is so yummy and all authentic... My go to Coorg and stay here for next visit... A safe stay for family...',
    author: 'Manoj Naik',
  },
  {
    source: 'Google',
    rating: 5,
    text: 'Very good experience. Would recommend to anyone who wants peace with best quality stay and food experience, super clean rooms. Not only the stay people around were very helpful with all our requirements. They were available even at 6AM to give us what we need. Pleasant and peaceful stay.',
    author: 'Sujatha V',
  },
  {
    source: 'Airbnb',
    rating: 5,
    text: 'Great place to be there! Host is extensively responsive and supportive. I would definitely visit again whenever get the opportunity.',
    author: 'Anil',
  },
];

function renderReviews(reviews) {
  if (!grid) return;
  grid.innerHTML = reviews
    .map(
      (review) => `
      <article class="review-card">
        <h3>${review.source} review</h3>
        <p class="rating">${review.rating.toFixed(1)} ★</p>
        <p class="review-text">${review.text}</p>
        <small>— ${review.author}</small>
      </article>
    `
    )
    .join('');
}

document.getElementById('year').textContent = new Date().getFullYear();

// Use static reviews (no API)
renderReviews(REVIEWS);

// Custom cursor (matches main site – Taj-style hover effect)
function initCustomCursor() {
  const hasFinPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasFinPointer) return;

  const cursorDot = document.querySelector('.pointer-dot');
  const cursorGlow = document.querySelector('.pointer-glow');
  const cursorTrail = document.querySelector('.pointer-trail');
  if (!cursorDot || !cursorGlow || !cursorTrail) return;

  document.body.classList.add('custom-cursor-enabled');

  let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
    cursorGlow.style.left = mouseX + 'px';
    cursorGlow.style.top = mouseY + 'px';
  });

  function animateTrail() {
    trailX += (mouseX - trailX) * 0.1;
    trailY += (mouseY - trailY) * 0.1;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top = trailY + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  const interactive = 'a, button, .review-card';
  document.addEventListener('mouseenter', (e) => {
    if (e.target.matches(interactive)) cursorGlow.classList.add('active');
  }, true);
  document.addEventListener('mouseleave', (e) => {
    if (e.target.matches(interactive)) cursorGlow.classList.remove('active');
  }, true);
}
initCustomCursor();
