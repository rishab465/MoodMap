import { useNavigate } from "react-router-dom";
import MoodCard from "../components/MoodCard.jsx";
import { useTheme } from "../theme/ThemeContext.jsx";

const moodOptions = [
  {
    value: "Happy",
    title: "Happy",
    icon: "😊",
    caption: "Bright, upbeat venues packed with colorful energy.",
    description: "Think rooftop lounges, pop-up concerts, and dessert bars glowing in warm neon.",
    gradient: "linear-gradient(135deg, #fde68a 0%, #f97316 45%, #fb7185 100%)",
    textColor: "#1f2937",
    shadow: "0 34px 80px -36px rgba(249, 115, 22, 0.55)",
  },
  {
    value: "Sad",
    title: "Sad",
    icon: "🌦️",
    caption: "Comfort-first hideaways with soft light and mellow playlists.",
    description: "Cozy cafés, quiet bookstores, and pastel lounges built for a slow unwind.",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #818cf8 100%)",
    textColor: "#e0f2fe",
    shadow: "0 34px 80px -36px rgba(129, 140, 248, 0.45)",
  },
  {
    value: "Angry",
    title: "Angry",
    icon: "🔥",
    caption: "High-energy spaces that channel intensity into momentum.",
    description: "Boxing classes, night-time arcades, and bold tasting rooms with moody lighting.",
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 45%, #ef4444 100%)",
    textColor: "#fee2e2",
    shadow: "0 34px 80px -36px rgba(239, 68, 68, 0.55)",
  },
  {
    value: "Calm",
    title: "Calm",
    icon: "🌿",
    caption: "Airy environments with gentle greenery and open space.",
    description: "Botanical walks, soft-light galleries, and tea lounges that keep everything balanced.",
    gradient: "linear-gradient(135deg, #d1fae5 0%, #99f6e4 45%, #67e8f9 100%)",
    textColor: "#0f172a",
    shadow: "0 34px 80px -36px rgba(16, 185, 129, 0.35)",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { mood: activeMood, setMood, theme } = useTheme();

  const handleFindPlaces = () => {
    navigate("/map", { state: { mood: activeMood } });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 lg:px-10">
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-5">
          <span className="pill-tag inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
            <span>🌈</span>
            Mood-first exploring
          </span>
          <h1 className="text-primary text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Discover places that match your vibe
          </h1>
          <p className="text-secondary max-w-2xl text-base leading-7">
            Choose how you feel and MoodMap shifts the entire experience to match—colors, textures, and
            recommendations adapt instantly for the next adventure.
          </p>
        </div>
        <div className="glass-panel flex w-full max-w-xs flex-col gap-3 rounded-3xl p-5 text-sm text-secondary shadow-lg sm:w-auto">
          <p className="text-primary font-semibold">How it works</p>
          <div className="flex items-start gap-3">
            <span className="step-bullet mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
              1
            </span>
            <p>Select the mood that captures your moment.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="step-bullet mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
              2
            </span>
            <p>We refresh the theme and curate matching spots.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="step-bullet mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
              3
            </span>
            <p>Preview the map, explore, and save favorites.</p>
          </div>
        </div>
      </div>

      <section className="grid flex-1 gap-6 md:grid-cols-2">
        {moodOptions.map((option) => (
          <MoodCard
            key={option.value}
            value={option.value}
            title={option.title}
            icon={option.icon}
            caption={option.caption}
            description={option.description}
            gradient={option.gradient}
            textColor={option.textColor}
            shadow={option.shadow}
            isSelected={activeMood === option.value}
            onSelect={setMood}
          />
        ))}
      </section>

      <div className="glass-panel-strong flex flex-col gap-6 rounded-3xl px-8 py-8 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-primary text-xl font-semibold">Ready to explore?</h2>
          <p className="text-secondary text-sm">{theme.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="pill-tag flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium">
            Mood: {activeMood}
          </div>
          <button
            type="button"
            onClick={handleFindPlaces}
            className="btn-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/65 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Start exploring
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Home;
