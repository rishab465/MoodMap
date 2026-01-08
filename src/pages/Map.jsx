import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Shared Leaflet marker configuration keeps icons consistent
const baseMarkerOptions = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
};

const userIcon = new L.Icon(baseMarkerOptions);
const placeIcon = new L.Icon(baseMarkerOptions);

// Keeps the map viewport synced with the latest user position
const MapRecentre = ({ targetPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (!targetPosition) return;
    map.setView([targetPosition.lat, targetPosition.lng]);
  }, [map, targetPosition]);

  return null;
};

const moodPlaceMapping = {
  Sad: {
    query: "cozy cafe",
    reason: "Warm drinks and soft lighting bring gentle comfort.",
  },
  Happy: {
    query: "live music venue",
    reason: "Lively music keeps the celebration energy up.",
  },
  Stressed: {
    query: "quiet park",
    reason: "Calm green paths help slow the pace and breathe.",
  },
  Romantic: {
    query: "romantic restaurant",
    reason: "Intimate dining setups support meaningful moments.",
  },
};

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedMood = location.state?.mood;

  const [userPosition, setUserPosition] = useState(null); // Real coordinates once permission succeeds
  const [geoError, setGeoError] = useState(null); // Store any geolocation error message
  const [recommendedPlaces, setRecommendedPlaces] = useState([]); // Places from Nominatim
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null); // Optional UX note about accuracy

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Fetched user position:", latitude, longitude); // Quick check in DevTools
        console.log("Accuracy (meters):", position.coords.accuracy);
        setUserPosition({ lat: latitude, lng: longitude });
        if (position.coords.accuracy > 10000) {
          setLocationNotice("Location is approximate on desktop. For best accuracy, use mobile GPS.");
        } else {
          setLocationNotice(null);
        }
        setRecommendedPlaces([]);
      },
      () => {
        setGeoError("We could not access your location. Please enable location services and refresh.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  useEffect(() => {
    if (!userPosition || !selectedMood) {
      return;
    }

    const moodConfig = moodPlaceMapping[selectedMood] ?? null;
    if (!moodConfig) {
      return;
    }

    const controller = new AbortController();
    const fetchPlaces = async () => {
      setIsLoadingPlaces(true);
      setPlacesError(null);
      setRecommendedPlaces([]);

      const { lat, lng } = userPosition;
      const rangeOffset = 0.02; // ~2km bounding box
      const viewbox = [
        (lng - rangeOffset).toFixed(6),
        (lat - rangeOffset).toFixed(6),
        (lng + rangeOffset).toFixed(6),
        (lat + rangeOffset).toFixed(6),
      ].join(",");

      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", moodConfig.query);
      url.searchParams.set("limit", "12");
      url.searchParams.set("lat", lat.toString());
      url.searchParams.set("lon", lng.toString());
      url.searchParams.set("viewbox", viewbox);
      url.searchParams.set("bounded", "1");
      url.searchParams.set("addressdetails", "0");

      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Unable to fetch nearby places right now.");
        }

        const data = await response.json();
        const normalized = data.map((item, index) => ({
          id: item.place_id?.toString() ?? `${item.lat}-${item.lon}-${index}`,
          name: item.display_name ? item.display_name.split(",")[0] : moodConfig.query,
          position: [parseFloat(item.lat), parseFloat(item.lon)],
          reason: moodConfig.reason,
        }));

        if (normalized.length === 0) {
          setPlacesError("No nearby spots matched this mood. Try another mood or zoom out.");
        }

        setRecommendedPlaces(normalized);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Nominatim fetch error", error);
        setPlacesError("We could not load mood suggestions. Please try again in a moment.");
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    fetchPlaces();

    return () => {
      controller.abort();
    };
  }, [userPosition, selectedMood]);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-[-6rem] -z-10 flex justify-center">
        <div className="h-72 w-72 rounded-full bg-sky-200/40 blur-3xl"></div>
      </div>

      <section className="rounded-3xl border border-emerald-100 bg-white/80 px-8 py-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">Recommendation preview</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Showing nearby places for mood: <span className="text-emerald-600">{selectedMood || "No mood selected"}</span>
        </h2>
        {geoError ? (
          <p className="mt-3 text-sm text-rose-500">{geoError}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Allow location access to see the map centered around you along with a few practice pins.
          </p>
        )}
      </section>

      <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-emerald-100 bg-white/80 px-4 py-4 shadow-lg">
        {!userPosition && !geoError ? (
          <div className="flex h-[480px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 text-center text-slate-600">
            <span className="text-2xl">🧭</span>
            <p className="text-sm font-medium">Waiting for your location...</p>
            <p className="text-xs text-slate-500">If it takes too long, ensure browser permissions allow location access.</p>
          </div>
        ) : null}

        {userPosition ? (
          <MapContainer
            center={[userPosition.lat, userPosition.lng]}
            zoom={14}
            className="h-[480px] w-full rounded-2xl"
          >
            <MapRecentre targetPosition={userPosition} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
              <Popup>You are here.</Popup>
            </Marker>
            {recommendedPlaces.map((place) => (
              <Marker key={place.id} position={place.position} icon={placeIcon}>
                <Popup>
                  <strong>{place.name}</strong>
                  <br />
                  {place.reason}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : null}

        {isLoadingPlaces ? (
          <p className="text-xs text-slate-500">Loading mood-matched places nearby...</p>
        ) : null}
        {placesError ? (
          <p className="text-xs text-rose-500">{placesError}</p>
        ) : null}
        {locationNotice ? (
          <p className="text-xs text-slate-500">{locationNotice}</p>
        ) : null}

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-auto inline-flex items-center gap-2 self-end rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Choose a different mood
          <span aria-hidden>↺</span>
        </button>
      </div>
    </main>
  );
};

export default Map;
