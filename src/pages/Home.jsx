import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoodCard from "../components/MoodCard.jsx";

const moods = [
  {
    mood: "Sad",
    caption: "Looking for comfort food or soothing spaces.",
    icon: "🌦️",
    iconBg: "bg-sky-100 text-sky-600",
    textColor: "text-sky-700",
  },
  {
    mood: "Happy",
    caption: "Ready to celebrate with lively spots.",
    icon: "🌞",
    iconBg: "bg-amber-100 text-amber-600",
    textColor: "text-amber-600",
  },
  {
    mood: "Stressed",
    caption: "Need quiet corners or calming activities.",
    icon: "🌿",
    iconBg: "bg-emerald-100 text-emerald-600",
    textColor: "text-emerald-600",
  },
  {
    mood: "Romantic",
    caption: "Searching for cozy, date-friendly places.",
    icon: "💞",
    iconBg: "bg-pink-100 text-pink-600",
    textColor: "text-pink-600",
  },
];

const Home = () => {
  const [selectedMood, setSelectedMood] = useState(null); // Track which mood the user picked
  const navigate = useNavigate();

  const handleFindPlaces = () => {
    if (!selectedMood) return;
    navigate("/map", { state: { mood: selectedMood } }); // Pass the choice to the map page
  };

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] -z-10 flex justify-center">
        <div className="h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"></div>
      </div>

      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 shadow">
            <span>🌈</span>
            Mood-first exploring
          </span>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
            Discover places that match your vibe
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Tell us how you feel right now and MoodMap will suggest restaurants, hangouts, and local
            experiences that fit the moment. A single mood unlocks a curated plan on the next screen.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3 rounded-3xl border border-emerald-100 bg-white/70 p-5 text-sm text-slate-600 shadow sm:w-auto">
          <p className="font-semibold text-slate-900">How it works</p>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-600">
              1
            </span>
            <p>Pick the mood that feels right.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-600">
              2
            </span>
            <p>We prepare matching spots for you.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-600">
              3
            </span>
            <p>Preview the map and save your favorites.</p>
          </div>
        </div>
      </div>

      <section className="grid flex-1 gap-6 md:grid-cols-2">
        {moods.map((item) => (
          <MoodCard
            key={item.mood}
            mood={item.mood}
            caption={item.caption}
            icon={item.icon}
            iconBg={item.iconBg}
            textColor={item.textColor}
            isSelected={selectedMood === item.mood}
            onSelect={setSelectedMood}
          />
        ))}
      </section>

      <div className="flex flex-col gap-6 rounded-3xl border border-emerald-100 bg-white/80 px-8 py-8 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Ready to explore?</h2>
          <p className="text-sm text-slate-600">Choose a mood above to activate the search button.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center justify-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
            {selectedMood ? `Mood: ${selectedMood}` : "No mood selected yet"}
          </div>
          <button
            type="button"
            onClick={handleFindPlaces}
            disabled={!selectedMood}
            className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition ${
              selectedMood
                ? "bg-emerald-500 text-white shadow-lg hover:bg-emerald-400"
                : "cursor-not-allowed bg-emerald-200 text-emerald-500"
            }`}
          >
            Find places
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Home;
