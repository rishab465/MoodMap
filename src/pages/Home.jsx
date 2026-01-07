import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoodCard from "../components/MoodCard.jsx";

const moods = [
  {
    mood: "Sad",
    caption: "Looking for comfort food or soothing spaces.",
  },
  {
    mood: "Happy",
    caption: "Ready to celebrate with lively spots.",
  },
  {
    mood: "Stressed",
    caption: "Need quiet corners or calming activities.",
  },
  {
    mood: "Romantic",
    caption: "Searching for cozy, date-friendly places.",
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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-14 px-6 py-16">
      <header className="rounded-3xl border border-emerald-400/20 bg-slate-800/60 px-10 py-12 shadow-lg shadow-emerald-500/5">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/70">Discover your vibe</p>
        <h1 className="mt-4 text-4xl font-bold text-emerald-200 md:text-5xl">
          Mood-Based Place Finder
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Select how you are feeling and we will curate places that match your energy.
          Pick one mood to unlock tailored suggestions in the next step.
        </p>
      </header>

      <section className="grid flex-1 gap-8 md:grid-cols-2">
        {moods.map((item) => (
          <MoodCard
            key={item.mood}
            mood={item.mood}
            caption={item.caption}
            isSelected={selectedMood === item.mood}
            onSelect={setSelectedMood}
          />
        ))}
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-800/60 px-6 py-6 shadow-inner shadow-slate-900/40">
        <div>
          <h2 className="text-lg font-semibold text-emerald-200">Ready to explore?</h2>
          <p className="text-sm text-slate-400">Choose a mood above to activate the search button.</p>
        </div>
        <button
          type="button"
          onClick={handleFindPlaces}
          disabled={!selectedMood}
          className={`rounded-full px-7 py-3 text-sm font-semibold transition ${
            selectedMood
              ? "bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-emerald-300"
              : "cursor-not-allowed bg-slate-700/70 text-slate-400"
          }`}
        >
          Find Places
        </button>
      </div>
    </main>
  );
};

export default Home;
