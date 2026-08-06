# Fishing Dashboard — Final Master v9.0.0

Premium fishing intelligence dashboard for iPhone (Safari PWA).

**Location default:** Κάλυμνος, Ελλάδα  
**Language:** Greek  
**Visual authority:** MASTER_FINAL_REFERENCE.jpeg

## Files
- `index.html` — structure + SVG assets + demo config
- `style.css` — visual system (v9)
- `app.js` — data, rendering, interactions, localStorage
- `manifest.json` — PWA manifest
- `service-worker.js` — basic offline cache

## How to run locally
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages
1. Push these files to the `main` branch of the repository.
2. Enable GitHub Pages from the root (or /docs if preferred).
3. Clear browser cache after deploy (or bump ?v= query).

## Features (working)
- Vertical scroll (no accidental horizontal overflow)
- Horizontal touch/drag scroll on hourly strips
- Favorite + Refresh (with rotation)
- Technique selection (persisted)
- Bottom navigation (persisted)
- Widget reorder (edit mode via menu button)
- Widget resize (compact / half / wide)
- Pressure & Tide charts (data-driven SVG)
- localStorage persistence
- Demo data with graceful fallback
- Reduced-motion support

## Locked Master values (demo)
- Date: Κυριακή 2 Αυγούστου 2026 (overridden by live clock in app.js — change buildDemoData if you want pure locked snapshot)
- Score 85, Moon 72% Αύξουσα Αμφίκυρτη, Pressure 1019 stable, etc.

## Next steps for pixel-perfect
Compare screenshots at iPhone viewport (390×844) against MASTER_FINAL_REFERENCE.jpeg and tune CSS spacing/colors.
