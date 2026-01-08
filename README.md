# Mood-Based Place Finder (Phase 1)

Front-end scaffold for a mood-driven location discovery app. This phase focuses on delivering a polished React UI with routing and Tailwind styling so future data integrations have a strong visual foundation.

## Features
- React Router with Home (`/`) and Map (`/map`) routes.
- Mood selection cards (Sad, Happy, Stressed, Romantic) with visual feedback.
- Disabled state for the action button until a mood is selected.
- Map page confirms the selected mood and presents a styled placeholder for future map work.

## Tech Stack
- Vite + React 19
- React Router DOM 7
- Tailwind CSS 3
- ESLint (recommended rules)

## Project Structure
```
src/
	components/
		MoodCard.jsx
	pages/
		Home.jsx
		Map.jsx
	App.jsx
	main.jsx
	index.css
```

## Getting Started
```bash
npm install
npm run dev    # start local dev server
npm run build  # production build check
```

## Next Steps
- Integrate a real map provider (Google Maps, Mapbox, etc.).
- Wire moods to curated place recommendations.
- Add backend/API layer for location data and filtering.

## Resume Summary
“Built the React + Tailwind UI scaffold for a mood-driven place finder, delivering interactive mood selection, router-based navigation, and a polished roadmap for future map and data integrations.”
