const grid = document.getElementById('reviewsGrid');

async function loadReviews() {
  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error();
    grid.innerHTML = data
      .map(
        (review) => `
        <article class="review-card">
          <h3>${review.source}</h3>
          <p class="rating">${review.rating.toFixed(1)} ★</p>
          <p>${review.text}</p>
          <small>— ${review.author}, ${new Date(review.date).toLocaleDateString()}</small>
          <div style="margin-top:0.5rem;">
            <a href="${review.link}" target="_blank" rel="noopener">View on ${review.source}</a>
          </div>
        </article>
      `
      )
      .join('');
  } catch (err) {
    grid.innerHTML =
      '<p>Unable to load reviews right now. Please try again in a moment.</p>';
  }
}

document.getElementById('year').textContent = new Date().getFullYear();
loadReviews();

