# Performance guide — avoid lag before and after deployment

These steps keep the site fast with high-quality images and the hero drone video.

---

## 1. Hero drone video

**Upload your video**

- Place your `.mov` file in: **`public/assets/hero-drone.mov`**
- The hero uses a **poster** image (`Background.jpeg`) until the video loads, so the section is never empty.

**Better compatibility and smaller size**

- **.mov** works in Safari; Chrome and Firefox often need **MP4**.
- Add an MP4 version for all browsers: put **`public/assets/hero-drone.mp4`** in the same folder. The page already has a second `<source>` for it; browsers will pick the format they support.
- To create a small, web-friendly MP4: use [HandBrake](https://handbrake.fr/) or similar, **H.264**, resolution **1920×1080 or 1280×720**, and a moderate bitrate (e.g. 2–4 Mbps). Keep the clip short (e.g. 15–30 seconds, looped) to reduce load.

---

## 2. Images (high quality without lag)

**Already done in the code**

- **Lazy loading**: Below-the-fold images use `loading="lazy"` so they load as you scroll.
- **Async decoding**: `decoding="async"` on images so decoding doesn’t block the main thread.
- **Gallery**: Only the first visible carousel image loads eagerly; the rest load when needed.

**Before deployment (recommended)**

- **Compress images** without visibly losing quality:
  - [Squoosh](https://squoosh.app/) (WebP or optimized JPEG/PNG)
  - [TinyPNG](https://tinypng.com/) (JPEG/PNG)
- **Responsive images** (optional): For very large photos, provide smaller versions (e.g. 800px wide) for mobile and use `srcset` so devices load an appropriate size.
- **WebP**: Use WebP with a JPEG/PNG fallback for critical images if you want maximum savings; the current JPEG/PNG setup is fine if files are compressed.

---

## 3. Deployment

- **Hosting**: Use a host with a CDN (e.g. Vercel, Netlify, Cloudflare Pages) so assets are served from edge locations and feel faster.
- **Caching**: Ensure the server/CDN sends cache headers for images and video (e.g. long `max-age` for `assets/`).
- **HTTPS**: Always use HTTPS in production.

---

## 4. Quick checklist

| Item | Action |
|------|--------|
| Hero video | Add `public/assets/hero-drone.mov` (and optionally `hero-drone.mp4`) |
| Video size | Keep short, compress to 720p/1080p H.264 for web |
| Images | Compress JPEG/PNG with Squoosh or TinyPNG before deploy |
| Deploy | Use a host with CDN and enable caching for static assets |

The site is already set up to avoid lag (lazy loading, async decoding, video poster, minimal eager loads). Compressing the video and images before deployment will keep it fast for all users.
