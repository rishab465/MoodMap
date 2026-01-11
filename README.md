src/
# MoodMap – Mood-Based Place Finder

MoodMap is a frontend-only web experience that suggests uplifting places based on how a user feels. It layers React, Leaflet, and the OpenStreetMap (Nominatim) search API to guarantee relevant pins even when live data is sparse.

## Problem Statement
People often want a quick recommendation that matches their current mood without sifting through long lists. MoodMap asks for the user’s mood, locates them, and instantly supplies nearby ideas.

## How It Works
1. User arrives on the Home view and selects a mood.
2. The Map view requests geolocation (with a manual fallback for laptops).
3. The app queries OpenStreetMap/Nominatim with mood-tuned keywords and a wide safety radius.
4. Results are deduplicated, scored for proximity, and shown on the map plus a card list.
5. If the API returns nothing, handcrafted placeholder spots ensure the user still sees useful guidance.

## Tech Stack
- React 19 + Vite
- React Router DOM 7
- Leaflet + react-leaflet
- Tailwind CSS 3
- OpenStreetMap Nominatim API

## Key Features
- Mood-aware keyword mapping that makes every search feel tailored.
- Reliable location handling with browser geolocation, manual lookup, and cached sessions.
- Layered search radius to balance hyper-local suggestions with citywide backups.
- Guaranteed recommendations using clearly labelled fallback spots when data is thin.
- Responsive UI with map markers, card previews, and friendly status messaging.

## Architecture Note
MoodMap is intentionally frontend-driven: all data comes directly from the user’s browser to OpenStreetMap. This keeps hosting simple and avoids maintaining servers during early validation. A backend service can be added later for rate limiting, analytics, and curated datasets.

## Future Improvements
- Add a Node/Express API that fronts Nominatim to provide caching, retries, and analytics.
- Layer in community-curated or partner datasets for premium suggestions.
- Store recent adventures so users can build a mood history.
- Package the experience as a PWA for quick mobile access.

## Getting Started
```bash
npm install
npm run dev    # start local development server
npm run build  # create a production build
```

## Resume Snapshot
“Led MoodMap, a React + Leaflet frontend that maps mood-based recommendations using OpenStreetMap APIs. Built resilient geolocation flows, fallback suggestions, and a polished UX ready for future backend expansion.”
