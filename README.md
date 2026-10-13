# Dulo-style Streaming — Static Demo

This is a client-side static demo of a streaming-style site (for demo and development only). It includes:

- index.html — main page.
- css/style.css — styling.
- js/app.js — app logic (routing, search, player, admin UI saved to localStorage).
- data/movies.json — demo dataset (YouTube IDs as example embeds). Includes some public-domain movies.

How to run
1. Put the files in the same folder structure:
   - index.html
   - css/style.css
   - js/app.js
   - data/movies.json

2. Open `index.html` in your browser (double-click or use Live Server extension for automatic reloads).

Notes and next steps
- The demos use YouTube embed IDs in `data/movies.json` (field `video`). Replace with your licensed embed IDs or your own video player/source.
- The Admin page stores additions in your browser localStorage. Use Export JSON to download your additions, or ask Copilot to commit them into the repository.
- If you want streaming from external sources, be careful about legal/terms-of-service issues.
- I can:
  - Convert this to a React/Next app (with components, SSR, image optimization).
  - Add a Node/Express backend to serve secure manifests or proxy licensed streams.
  - Push admin additions to this GitHub repo if you authorize me to commit them.
  - Deploy the site to GitHub Pages for you (it's ready; ask me to enable Pages and I will).
