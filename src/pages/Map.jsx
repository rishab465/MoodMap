import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../theme/ThemeContext.jsx";

const markerOptions = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
};

const userIcon = new L.Icon(markerOptions);
const placeIcon = new L.Icon(markerOptions);

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  // Identifying the app keeps requests within Nominatim policy.
  "User-Agent": "MoodMap Frontend (https://github.com/rishab465/MoodMap)",
};

const MAX_RESULTS = 20; // Show more options to the user.
const PRIMARY_RADIUS_KM = 6; // Cast a wider net for the first pass.
const CITY_RADIUS_KM = PRIMARY_RADIUS_KM * 5; // Expand city-level search even further.
const BASE_MAX_DISTANCE_KM = 20; // Allow farther results when GPS is precise.

const MOOD_KEYWORDS = {
  Happy: {
    keywords: ["live music", "rooftop bar", "festival", "dessert cafe"],
    reason: "Upbeat venues keep the celebration going.",
  },
  Sad: {
    keywords: ["cozy cafe", "bookstore", "tea lounge", "soothing spa"],
    reason: "Warm lighting and calm playlists help reset the mood.",
  },
  Angry: {
    keywords: ["boxing studio", "arcade bar", "escape room", "indoor climbing"],
    reason: "High-energy experiences channel intensity in a grounded way.",
  },
  Calm: {
    keywords: ["botanical garden", "meditation studio", "tea house", "nature walk"],
    reason: "Soft nature-backed experiences keep things peaceful.",
  },
};

const BASE_KEYWORDS = ["restaurant", "park", "cafe", "museum", "shopping"];

const MapRecentre = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.setView([target.lat, target.lng], 14);
  }, [map, target]);

  return null;
};

const safeName = (name, fallback) => {
  if (!name) return fallback;
  const [first] = name.split(",");
  return first?.trim() || fallback;
};

const buildSearchUrl = ({ term, centre, radiusKm, bounded }) => {
  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("q", term);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "20");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");

  if (centre && bounded) {
    const padding = radiusKm / 111; // Rough degrees to km conversion around the equator.
    const north = centre.lat + padding;
    const south = centre.lat - padding;
    const east = centre.lng + padding * Math.cos((centre.lat * Math.PI) / 180);
    const west = centre.lng - padding * Math.cos((centre.lat * Math.PI) / 180);
    url.searchParams.set("bounded", "1");
    url.searchParams.set("viewbox", `${west},${north},${east},${south}`);
  } else {
    url.searchParams.set("bounded", "0");
  }

  return url.toString();
};

const fetchAndNormalize = async ({ url, reason, fallbackTerm }) => {
  try {
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item, index) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const fallbackName = `${fallbackTerm} ${index + 1}`;
        return {
          id: item.place_id?.toString() || `${lat},${lng}`,
          name: safeName(item.display_name, fallbackName),
          position: [lat, lng],
          description: item.display_name,
          isFallback: false,
          tags: item.extratags || {},
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn("Nominatim error", error);
    return [];
  }
};

const createMockPlaces = ({ centre, reason, count }) => {
  const offsets = [
    { label: "North Hangout", lat: 0.01, lng: 0 },
    { label: "East Hangout", lat: 0, lng: 0.01 },
    { label: "South Hangout", lat: -0.01, lng: 0 },
    { label: "West Hangout", lat: 0, lng: -0.01 },
    { label: "Lakeside Retreat", lat: 0.006, lng: -0.006 },
    { label: "Sunset Deck", lat: -0.006, lng: 0.006 },
    { label: "Garden Nook", lat: 0.008, lng: 0.004 },
    { label: "River Bend", lat: -0.004, lng: -0.008 },
    { label: "Central Spot", lat: 0.004, lng: 0.004 },
    { label: "Skyline Lookout", lat: -0.008, lng: 0.002 },
  ];

  return offsets.slice(0, count).map((offset, index) => ({
    id: `mock-${index}`,
    name: offset.label,
    position: [centre.lat + offset.lat, centre.lng + offset.lng],
    description: reason,
    isFallback: true,
  }));
};

const dedupeByLocation = (places) => {
  const seen = new Set();
  return places.filter((place) => {
    const key = `${place.position[0].toFixed(4)}-${place.position[1].toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Haversine formula: calculates straight-line distance between two lat/lng points in kilometers.
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Removes any places outside the max allowed distance from the user's location.
const filterByDistance = (places, userLat, userLng, maxKm) => {
  return places.filter((place) => {
    const [placeLat, placeLng] = place.position;
    const dist = distanceKm(userLat, userLng, placeLat, placeLng);
    return dist <= maxKm;
  });
};

const deriveDistanceLimit = (coords) => {
  if (!coords) {
    return BASE_MAX_DISTANCE_KM;
  }
  if (!Number.isFinite(coords.accuracy)) {
    return 35;
  }
  const accuracyKm = Math.min(80, Math.max(10, coords.accuracy / 1000 + 5));
  return Math.max(BASE_MAX_DISTANCE_KM, Math.round(accuracyKm));
};

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mood: activeMood, setMood, theme } = useTheme();
  const routeMood = location.state?.mood;

  const [userPosition, setUserPosition] = useState(() => {
    if (typeof window === "undefined") return null;
    const cached = window.sessionStorage.getItem("moodmap:lastLocation");
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch (error) {
      console.warn("Failed to read cached location", error);
      return null;
    }
  });

  const [geoStatus, setGeoStatus] = useState("Requesting location…");
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [lastGpsUpdate, setLastGpsUpdate] = useState(null);
  const watchIdRef = useRef(null);

  const persistLocation = useCallback((coords) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.sessionStorage.setItem("moodmap:lastLocation", JSON.stringify(coords));
    } catch (error) {
      console.warn("Failed to persist location", error);
    }
  }, []);

  const handlePosition = useCallback(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const coords = { lat: latitude, lng: longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null };

      setUserPosition((previous) => {
        if (previous && previous.lat === coords.lat && previous.lng === coords.lng && previous.accuracy === coords.accuracy) {
          return previous;
        }
        return coords;
      });

      setLastGpsUpdate(Date.now());
      persistLocation(coords);

      if (coords.accuracy == null) {
        setGeoStatus("Location found. Waiting for improved accuracy…");
        return;
      }

      if (coords.accuracy <= 50) {
        setGeoStatus("Precise location locked (±50 m).");
      } else if (coords.accuracy <= 150) {
        setGeoStatus(`Approximate location (±${Math.round(coords.accuracy)} m).`);
      } else {
        setGeoStatus("Location is rough. Try retrying GPS or enter a city manually.");
      }
    },
    [persistLocation]
  );

  const handlePositionError = useCallback((error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setGeoStatus("Permission denied. Enable GPS or enter a location manually.");
        break;
      case error.POSITION_UNAVAILABLE:
        setGeoStatus("Location unavailable. Move to an open area or enter a city manually.");
        break;
      case error.TIMEOUT:
        setGeoStatus("Location lookup timed out. Tap retry or enter a city manually.");
        break;
      default:
        setGeoStatus("We could not read GPS. Enter a location manually.");
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("Geolocation unavailable. Enter a city below.");
      return;
    }

    setGeoStatus("Requesting location…");
    navigator.geolocation.getCurrentPosition(handlePosition, handlePositionError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  }, [handlePosition, handlePositionError]);

  const handleRetryGps = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (routeMood && routeMood !== activeMood) {
      setMood(routeMood);
    }
  }, [routeMood, activeMood, setMood]);

  useEffect(() => {
    requestLocation();

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(handlePosition, handlePositionError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [handlePosition, handlePositionError, requestLocation]);

  const moodConfig = useMemo(() => {
    return {
      keywords: [...(MOOD_KEYWORDS[activeMood]?.keywords || []), ...BASE_KEYWORDS],
      reason: MOOD_KEYWORDS[activeMood]?.reason || "Local suggestion",
    };
  }, [activeMood]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastGpsUpdate) {
      return null;
    }
    try {
      return new Date(lastGpsUpdate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      return null;
    }
  }, [lastGpsUpdate]);

  const accuracyLabel = useMemo(() => {
    if (userPosition?.accuracy == null) {
      return null;
    }
    return `±${Math.max(1, Math.round(userPosition.accuracy))} m`;
  }, [userPosition]);

  const distanceLimitKm = useMemo(() => deriveDistanceLimit(userPosition), [userPosition]);

  const approximateNote = useMemo(() => {
    if (!userPosition) {
      return null;
    }

    if (userPosition.accuracy == null) {
      if (geoStatus.startsWith("Manual")) {
        return "Use the map controls to fine-tune this manual spot if needed.";
      }
      return "Browser provided an approximate location via network lookup.";
    }

    if (userPosition.accuracy <= 75) {
      return null;
    }

    if (userPosition.accuracy <= 150) {
      return "Location within roughly ±150 meters.";
    }

    return `Location is approximate. We widened search to ~${distanceLimitKm} km. Retry GPS or enter a specific city for better results.`;
  }, [userPosition, geoStatus, distanceLimitKm]);

  const handleManualLookup = async (event) => {
    event.preventDefault();
    const searchTerm = manualInput.trim();
    if (!searchTerm) {
      setManualError("Type a city, address, or landmark.");
      return;
    }

    try {
      setManualError(null);
      setGeoStatus("Finding that spot…");

      const url = new URL(NOMINATIM_BASE);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", searchTerm);
      url.searchParams.set("limit", "1");

      const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
      if (!response.ok) throw new Error("Manual lookup failed");

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setManualError("We could not find that place. Try a nearby city.");
        return;
      }

      const hit = data[0];
      const lat = Number(hit.lat);
      const lng = Number(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setManualError("That result looked odd. Please try again.");
        return;
      }

      const coords = { lat, lng, accuracy: null };
      setUserPosition(coords);
      setLastGpsUpdate(Date.now());
      persistLocation(coords);
      setGeoStatus("Manual location applied.");
      setManualInput("");
    } catch (error) {
      console.error("Manual lookup error", error);
      setManualError("We could not look up that place. Please try again.");
    }
  };

  useEffect(() => {
    if (!userPosition || !moodConfig) return;

    let active = true;
    setIsLoadingPlaces(true);

    const loadPlaces = async () => {
      const keywords = Array.from(new Set(moodConfig.keywords));
      const collected = [];

      for (const term of keywords) {
        if (!active) return;

        const nearbyUrl = buildSearchUrl({ term, centre: userPosition, radiusKm: PRIMARY_RADIUS_KM, bounded: true });
        const nearby = await fetchAndNormalize({ url: nearbyUrl, reason: moodConfig.reason, fallbackTerm: term });
        collected.push(...nearby);

        if (collected.length >= MAX_RESULTS) break;

        const cityUrl = buildSearchUrl({ term, centre: userPosition, radiusKm: CITY_RADIUS_KM, bounded: false });
        const cityWide = await fetchAndNormalize({ url: cityUrl, reason: moodConfig.reason, fallbackTerm: term });
        collected.push(...cityWide);

        if (collected.length >= MAX_RESULTS) break;
      }

      if (!active) return;

      let uniquePlaces = dedupeByLocation(collected).map((place) => ({
        ...place,
        reason: place.description || moodConfig.reason,
      }));

      // CRITICAL: Filter out anything too far away (prevents worldwide results).
      uniquePlaces = filterByDistance(uniquePlaces, userPosition.lat, userPosition.lng, distanceLimitKm);

      if (!uniquePlaces.length) {
        uniquePlaces = createMockPlaces({ centre: userPosition, reason: moodConfig.reason, count: Math.min(6, MAX_RESULTS) });
      }

      // Show only real places—no fake fallbacks. Empty is honest.
      if (active) {
        setRecommendedPlaces(uniquePlaces.slice(0, MAX_RESULTS));
        setIsLoadingPlaces(false);
      }
    };

    loadPlaces();

    return () => {
      active = false;
    };
  }, [moodConfig, userPosition, distanceLimitKm]);

  const moodReason = MOOD_KEYWORDS[activeMood]?.reason || "Local suggestion";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16 lg:px-10">

      <section className="glass-panel-strong rounded-3xl px-8 py-6 shadow-lg transition-colors duration-500">
        <p className="accent-text text-xs font-semibold uppercase tracking-[0.35em]">Recommendation preview</p>
        <h2 className="text-primary mt-3 text-2xl font-semibold">
          Showing nearby places for mood: <span className="accent-text">{activeMood}</span>
        </h2>
        <p className="text-subtle mt-1 text-xs">{theme.description}</p>
        <p className="text-secondary mt-3 text-sm">{geoStatus}</p>
        {approximateNote ? <p className="text-subtle mt-1 text-xs">{approximateNote}</p> : null}
        <form onSubmit={handleManualLookup} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="manual-location" className="text-subtle text-xs font-semibold uppercase tracking-[0.2em]">
            Manual location
          </label>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              id="manual-location"
              value={manualInput}
              onChange={(event) => {
                setManualInput(event.target.value);
                setManualError(null);
              }}
              placeholder="Try: Central Park, New York"
              className="input-soft w-full rounded-full px-4 py-2 text-xs"
            />
            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Use location
            </button>
          </div>
        </form>
        {manualError ? <p className="mt-2 text-xs text-rose-400">{manualError}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRetryGps}
            className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Retry GPS
          </button>
          {accuracyLabel ? (
            <span className="pill-tag inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]">
              GPS accuracy {accuracyLabel}
            </span>
          ) : null}
          {lastUpdatedLabel ? <span className="text-subtle text-xs">Last updated {lastUpdatedLabel}</span> : null}
        </div>
      </section>

      <div className="glass-panel flex flex-1 flex-col gap-4 rounded-3xl px-4 py-4 shadow-lg transition-colors duration-500">
        {!userPosition ? (
          <div className="empty-state flex h-[480px] w-full flex-col items-center justify-center gap-3 rounded-2xl text-center">
            <span className="text-2xl">🧭</span>
            <p className="text-primary text-sm font-semibold">Waiting for a location…</p>
            <p className="text-subtle text-xs">Allow GPS or enter a city above to unlock suggestions.</p>
          </div>
        ) : (
          <div className="relative" id="map-area">
            <MapContainer center={[userPosition.lat, userPosition.lng]} zoom={14} className="h-[480px] w-full rounded-2xl">
              <MapRecentre target={userPosition} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
              />
              <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
                <Popup>Your current location</Popup>
              </Marker>
              {recommendedPlaces.map((place) => (
                <Marker key={place.id} position={place.position} icon={placeIcon}>
                  <Popup>
                    <strong>{place.name}</strong>
                    <br />
                    {place.reason || moodReason}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {isLoadingPlaces ? (
              <div className="loading-overlay absolute inset-0 flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="loading-spinner"></div>
                  <div className="pill-tag inline-flex items-center justify-center rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                    Discovering places…
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {recommendedPlaces.length > 0 ? (
          <section className="glass-panel-strong grid gap-3 rounded-2xl p-4 shadow-inner transition-colors duration-500 sm:grid-cols-2 md:grid-cols-3">
            {recommendedPlaces.some((place) => place.isFallback) ? (
              <div className="sm:col-span-2 md:col-span-3">
                <p className="text-subtle text-xs">
                  Showing inspiration spots near the map center while we gather real venue data. Refine your location or try another mood for live matches.
                </p>
              </div>
            ) : null}
            {recommendedPlaces.map((place, index) => (
              <article
                key={`card-${place.id}`}
                className="glass-panel flex flex-col gap-3 rounded-xl p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="pill-tag inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]">
                  Pick #{index + 1}
                </span>
                <h3 className="text-primary text-lg font-semibold">{place.name}</h3>
                <p className="text-secondary text-sm">{place.reason || moodReason}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="btn-ghost mt-auto inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  View on map
                  <span aria-hidden>↗</span>
                </button>
              </article>
            ))}
          </section>
        ) : (
          <section className="empty-state flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center">
            <span className="text-2xl">🛰️</span>
            <p className="text-primary text-sm font-semibold">No live places yet</p>
            <p className="text-subtle text-xs">
              We could not find real venues within the current radius. Try retrying GPS, entering a city manually, or exploring the map.
            </p>
          </section>
        )}

        <button
          type="button"
          onClick={() => navigate("/")}
          className="btn-primary mt-auto inline-flex items-center gap-2 self-end rounded-full px-5 py-2 text-sm font-semibold shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/65 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Choose a different mood
          <span aria-hidden>↺</span>
        </button>
      </div>
    </main>
  );
};

export default Map;

