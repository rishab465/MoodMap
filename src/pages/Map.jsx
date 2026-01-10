import { useCallback, useEffect, useState } from "react";
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

const NOMINATIM_HEADERS = {
  Accept: "application/json",
};
const NOMINATIM_EMAIL = "moodmap@example.com";

const moodPlaceMapping = {
  Sad: {
    queries: ["cafe", "coffee shop"],
    reason: "Warm drinks and soft lighting bring gentle comfort.",
  },
  Happy: {
    queries: ["music", "bar", "live music"],
    reason: "Lively music keeps the celebration energy up.",
  },
  Stressed: {
    queries: ["park", "garden"],
    reason: "Calm green paths help slow the pace and breathe.",
  },
  Romantic: {
    queries: ["romantic restaurant", "restaurant"],
    reason: "Intimate dining setups support meaningful moments.",
  },
};

const RADIUS_OPTIONS_KM = [3, 6, 10, 15];
const DEFAULT_RADIUS_KM = 6;
const EARTH_RADIUS_KM = 6371;
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  if ([lat1, lon1, lat2, lon2].some((value) => !Number.isFinite(value))) {
    return Infinity;
  }
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
};

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedMood, setSelectedMood] = useState(() => {
    const moodFromNavigation = location.state?.mood;
    if (moodFromNavigation && moodPlaceMapping[moodFromNavigation]) {
      return moodFromNavigation;
    }

    if (typeof window !== "undefined") {
      const storedMood = window.sessionStorage.getItem("moodmap:lastMood");
      if (storedMood && moodPlaceMapping[storedMood]) {
        return storedMood;
      }
    }

    return null;
  });

  const [userPosition, setUserPosition] = useState(null); // Real coordinates once permission succeeds
  const [geoError, setGeoError] = useState(null); // Store any geolocation error message
  const [recommendedPlaces, setRecommendedPlaces] = useState([]); // Places from Nominatim
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null); // Optional UX note about accuracy
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [manualLocationError, setManualLocationError] = useState(null);
  const [isManualLookup, setIsManualLookup] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);
  const [activePlaceId, setActivePlaceId] = useState(null);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [radiusLoaded, setRadiusLoaded] = useState(false);

  const supportsGeolocation = typeof navigator !== "undefined" && !!navigator.geolocation;

  useEffect(() => {
    if (typeof window === "undefined" || radiusLoaded) {
      return;
    }
    const stored = window.sessionStorage.getItem("moodmap:radiusKm");
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setSelectedRadiusKm(parsed);
      }
    }
    setRadiusLoaded(true);
  }, [radiusLoaded]);

  useEffect(() => {
    const moodFromNavigation = location.state?.mood;
    if (moodFromNavigation && moodPlaceMapping[moodFromNavigation] && moodFromNavigation !== selectedMood) {
      setSelectedMood(moodFromNavigation);
    }
  }, [location.state, selectedMood]);

  useEffect(() => {
    if (!selectedMood || typeof window === "undefined") {
      return;
    }
    window.sessionStorage.setItem("moodmap:lastMood", selectedMood);
  }, [selectedMood]);

  useEffect(() => {
    if (typeof window === "undefined" || !radiusLoaded) {
      return;
    }
    if (radiusLoaded) {
      window.sessionStorage.setItem("moodmap:radiusKm", String(selectedRadiusKm));
    }
  }, [selectedRadiusKm, radiusLoaded]);

  const requestUserLocation = useCallback(() => {
    if (!supportsGeolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoError(null);
    setLocationNotice(null);
    setManualLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("Fetched user position:", latitude, longitude); // Quick check in DevTools
        console.log("Accuracy (meters):", accuracy);
        setUserPosition({ lat: latitude, lng: longitude });
        setMapFocus({ lat: latitude, lng: longitude });
        setRecommendedPlaces([]);
        setPlacesError(null);
        setManualLocationInput("");
        setActivePlaceId(null);
        if (accuracy > 10000) {
          setLocationNotice("Location is approximate on desktop. For best accuracy, use mobile GPS.");
        } else {
          setLocationNotice(null);
        }
      },
      (error) => {
        let message = "We could not access your location. Allow permissions or set a place manually.";
        if (error?.code === error?.PERMISSION_DENIED) {
          message = "Location access is blocked. Enable permissions for this site and choose Retry or set a place manually.";
        } else if (error?.code === error?.POSITION_UNAVAILABLE) {
          message = "We could not determine your location. Check your connection or set a place manually.";
        } else if (error?.code === error?.TIMEOUT) {
          message = "The location request timed out. Try again, or enter a location manually below.";
        }
        console.warn("Geolocation error", error);
        setGeoError(message);
        setUserPosition(null);
        setMapFocus(null);
        setRecommendedPlaces([]);
        setLocationNotice(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [supportsGeolocation]);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  const mapCenter = mapFocus ?? userPosition;

  const handleManualLocationSubmit = async (event) => {
    event.preventDefault();
    const searchTerm = manualLocationInput.trim();

    if (!searchTerm) {
      setManualLocationError("Please enter a city, address, or landmark.");
      return;
    }

    setIsManualLookup(true);
    setManualLocationError(null);
    setPlacesError(null);

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", searchTerm);
      url.searchParams.set("limit", "1");
      url.searchParams.set("addressdetails", "0");
      url.searchParams.set("email", NOMINATIM_EMAIL);

      const response = await fetch(url.toString(), {
        headers: NOMINATIM_HEADERS,
      });

      if (!response.ok) {
        throw new Error("Lookup failed");
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setManualLocationError("We could not find that location. Try a nearby city or landmark.");
        return;
      }

      const primary = data[0];
      const latitude = parseFloat(primary.lat);
      const longitude = parseFloat(primary.lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        setManualLocationError("We could not read that location. Please try again.");
        return;
      }

      const label = primary.display_name ? primary.display_name.split(",")[0] : searchTerm;

      setUserPosition({ lat: latitude, lng: longitude });
      setMapFocus({ lat: latitude, lng: longitude });
      setRecommendedPlaces([]);
      setLocationNotice(`Using manually set location near ${label}. Adjust the map to refine.`);
      setGeoError(null);
      setManualLocationInput("");
      setActivePlaceId(null);
    } catch (error) {
      console.error("Manual location lookup error", error);
      setManualLocationError("We could not look up that spot. Please try again in a moment.");
    } finally {
      setIsManualLookup(false);
    }
  };

  useEffect(() => {
    if (!userPosition || !selectedMood) {
      return;
    }

    const moodConfig = moodPlaceMapping[selectedMood] ?? null;
    if (!moodConfig) {
      return;
    }

    const controller = new AbortController();

    const buildUrl = ({ query, lat, lng, rangeOffset, bounded }) => {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "12");
      url.searchParams.set("lat", lat.toString());
      url.searchParams.set("lon", lng.toString());
      url.searchParams.set("bounded", bounded ? "1" : "0");
      url.searchParams.set("addressdetails", "0");
      url.searchParams.set("email", NOMINATIM_EMAIL);

      if (bounded) {
        // OpenStreetMap expects viewbox order: left, top, right, bottom (lon/lat)
        const viewbox = [
          (lng - rangeOffset).toFixed(6),
          (lat + rangeOffset).toFixed(6),
          (lng + rangeOffset).toFixed(6),
          (lat - rangeOffset).toFixed(6),
        ].join(",");
        url.searchParams.set("viewbox", viewbox);
      }

      return url;
    };

    const fetchPlaces = async () => {
      setIsLoadingPlaces(true);
      setPlacesError(null);
      setRecommendedPlaces([]);

        if (!radiusLoaded) {
          setIsLoadingPlaces(false);
          return;
        }

        const { lat, lng } = userPosition;
        const degreesPerKm = 1 / 111;
        const rangeOffset = Math.max(selectedRadiusKm * degreesPerKm * 1.6, 0.02); // Slightly larger viewbox
        const searchTerms = moodConfig.queries ?? [moodConfig.query].filter(Boolean);
        const fallbackTerms = ["restaurant", "park"];

        const normalizePlaces = (data, term, idPrefix) =>
          data
            .map((item, index) => {
              const placeLat = parseFloat(item.lat);
              const placeLon = parseFloat(item.lon);
              const distanceKm = calculateDistanceKm(lat, lng, placeLat, placeLon);

              return {
                id: item.place_id?.toString() ?? `${placeLat}-${placeLon}-${idPrefix}-${index}`,
                name: item.display_name ? item.display_name.split(",")[0] : term,
                position: [placeLat, placeLon],
                reason: moodConfig.reason,
                distanceKm,
              };
            })
            .filter(
              (place) =>
                Array.isArray(place.position) &&
                place.position.length === 2 &&
                Number.isFinite(place.position[0]) &&
                Number.isFinite(place.position[1]) &&
                Number.isFinite(place.distanceKm)
            );

        const fetchForTerm = async (term, idPrefix) => {
          const boundedUrl = buildUrl({
            query: term,
            lat,
            lng,
            rangeOffset,
            bounded: true,
          });

          let normalized = [];

          try {
            const boundedResponse = await fetch(boundedUrl.toString(), {
              signal: controller.signal,
              headers: NOMINATIM_HEADERS,
            });

            if (!boundedResponse.ok) {
              throw new Error("Bounded request failed");
            }

            const primaryData = await boundedResponse.json();
            console.log("Nominatim primary results", { term, count: primaryData.length });
            normalized = normalizePlaces(primaryData, term, `${idPrefix}-primary`);
          } catch (error) {
            console.warn("Bounded request issue", term, error);
          }

          if (normalized.length === 0) {
            const fallbackUrl = buildUrl({
              query: term,
              lat,
              lng,
              rangeOffset: rangeOffset * 1.5,
              bounded: false,
            });
            try {
              const fallbackResponse = await fetch(fallbackUrl.toString(), {
                signal: controller.signal,
                headers: NOMINATIM_HEADERS,
              });

              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                console.log("Nominatim fallback results", { term, count: fallbackData.length });
                normalized = normalizePlaces(fallbackData, term, `${idPrefix}-fallback`);
              }
            } catch (fallbackError) {
              console.warn("Fallback request issue", term, fallbackError);
            }
          }

          return normalized;
        };

      try {
        setMapFocus((current) => {
          if (current && current.lat === lat && current.lng === lng) {
            return current;
          }
          return { lat, lng };
        });
        setActivePlaceId(null);

        const accumulator = [];

        for (const term of searchTerms) {
          const results = await fetchForTerm(term, `mood-${term}`);
          if (results.length > 0) {
            accumulator.push(...results);
          }
        }

        if (accumulator.length === 0) {
          for (const term of fallbackTerms) {
            const results = await fetchForTerm(term, `fallback-${term}`);
            if (results.length > 0) {
              accumulator.push(...results);
              break;
            }
          }
        }

        const uniqueByKey = new Map();
        for (const place of accumulator) {
          const key = place.id ?? `${place.position[0]}-${place.position[1]}`;
          if (!uniqueByKey.has(key)) {
            uniqueByKey.set(key, place);
          }
        }

        const uniquePlaces = Array.from(uniqueByKey.values());

        if (uniquePlaces.length === 0) {
          setPlacesError("No nearby spots matched this mood. Try another mood or zoom out.");
          setRecommendedPlaces([]);
          setActivePlaceId(null);
          setIsLoadingPlaces(false);
          return;
        }

        const withinRadius = uniquePlaces.filter((place) => place.distanceKm <= selectedRadiusKm);

        if (withinRadius.length === 0) {
          setPlacesError(`No spots within ${selectedRadiusKm} km. Try increasing the search radius.`);
          setRecommendedPlaces([]);
          setActivePlaceId(null);
          setIsLoadingPlaces(false);
          return;
        }

        const trimmed = withinRadius
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 6);

        setRecommendedPlaces(trimmed);
        setActivePlaceId((current) => (trimmed.some((place) => place.id === current) ? current : null));
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
  }, [userPosition, selectedMood, selectedRadiusKm, radiusLoaded]);

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
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <label
            htmlFor="search-radius"
            className="font-semibold uppercase tracking-[0.2em] text-slate-500"
          >
            Search radius
          </label>
          <select
            id="search-radius"
            value={selectedRadiusKm}
            onChange={(event) => {
              const next = Number(event.target.value);
              setSelectedRadiusKm(next);
              setMapFocus(null);
            }}
            className="rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-600 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {[...new Set([...RADIUS_OPTIONS_KM, selectedRadiusKm])]
              .sort((a, b) => a - b)
              .map((option) => (
                <option key={option} value={option}>
                  {option} km
                </option>
              ))}
          </select>
          <span className="text-[0.7rem] text-slate-500">
            Smaller distances keep things nearby; larger ones widen the search box.
          </span>
        </div>
        {(geoError || !userPosition) ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
            {supportsGeolocation ? (
              <button
                type="button"
                onClick={requestUserLocation}
                className="w-fit rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
              >
                Retry location access
              </button>
            ) : null}
            <form
              onSubmit={handleManualLocationSubmit}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
            >
              <label
                htmlFor="manual-location"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:w-48"
              >
                Manual location
              </label>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <input
                  id="manual-location"
                  type="text"
                  placeholder="Try: Central Park, New York"
                  value={manualLocationInput}
                  onChange={(event) => {
                    setManualLocationInput(event.target.value);
                    if (manualLocationError) {
                      setManualLocationError(null);
                    }
                  }}
                  disabled={isManualLookup}
                  className="w-full rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="submit"
                  disabled={isManualLookup}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isManualLookup ? "cursor-wait bg-emerald-200 text-emerald-500" : "bg-emerald-500 text-white hover:bg-emerald-400"
                  }`}
                >
                  {isManualLookup ? "Setting location..." : "Use location"}
                </button>
              </div>
            </form>
            {manualLocationError ? (
              <p className="text-xs text-rose-500">{manualLocationError}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-emerald-100 bg-white/80 px-4 py-4 shadow-lg">
        {!userPosition && !geoError ? (
          <div className="flex h-[480px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 text-center text-slate-600">
            <span className="text-2xl">🧭</span>
            <p className="text-sm font-medium">Waiting for your location...</p>
            <p className="text-xs text-slate-500">If it takes too long, ensure browser permissions allow location access.</p>
          </div>
        ) : null}

        {mapCenter ? (
          <div className="relative">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={14}
              className="h-[480px] w-full rounded-2xl"
            >
              <MapRecentre targetPosition={mapCenter} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
              />
              {userPosition ? (
                <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
                  <Popup>You are here.</Popup>
                </Marker>
              ) : null}
              {!isLoadingPlaces &&
                recommendedPlaces.map((place) => (
                  <Marker key={place.id} position={place.position} icon={placeIcon}>
                    <Popup>
                      <strong>{place.name}</strong>
                      <br />
                      {place.reason}
                      {Number.isFinite(place.distanceKm) ? (
                        <>
                          <br />
                          Approximately {place.distanceKm} km away
                        </>
                      ) : null}
                      {place.id === activePlaceId ? (
                        <>
                          <br />
                          <span className="font-semibold text-emerald-600">Highlighted pick</span>
                        </>
                      ) : null}
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
            {userPosition ? (
              <button
                type="button"
                onClick={() => {
                  setMapFocus({ lat: userPosition.lat, lng: userPosition.lng });
                  setActivePlaceId(null);
                }}
                className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-600 shadow hover:bg-white"
              >
                Recenter on me
                <span aria-hidden>⌖</span>
              </button>
            ) : null}
          </div>
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

        {recommendedPlaces.length > 0 ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-inner">
            <div className="flex flex-col gap-1 text-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-slate-900">Top matches right now</h3>
              <p className="text-xs text-slate-500">Pick a card to spotlight it on the map.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
            {recommendedPlaces.map((place, index) => (
              <article
                key={place.id}
                className={`flex flex-col gap-2 rounded-xl border bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  place.id === activePlaceId ? "border-emerald-300" : "border-emerald-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  <span>Pick #{index + 1}</span>
                  {Number.isFinite(place.distanceKm) ? <span>{place.distanceKm} km away</span> : null}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{place.name}</h3>
                <p className="text-sm text-slate-600">{place.reason}</p>
                <button
                  type="button"
                  className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 px-4 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
                  onClick={() => {
                    if (place.position?.length === 2) {
                      setActivePlaceId(place.id);
                      setMapFocus({ lat: place.position[0], lng: place.position[1] });
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }
                  }}
                >
                  View on map
                  <span aria-hidden>↗</span>
                </button>
              </article>
            ))}
            </div>
          </section>
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
