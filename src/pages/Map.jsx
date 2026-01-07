import { useLocation, useNavigate } from "react-router-dom";

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedMood = location.state?.mood; // Read the mood sent from the home page

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <section className="rounded-3xl border border-emerald-400/25 bg-slate-800/70 px-10 py-12 text-center shadow-lg shadow-emerald-500/10">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Recommendation preview</p>
        <h2 className="mt-5 text-3xl font-semibold text-emerald-200">
          Showing places for: <span className="font-bold text-emerald-300">{selectedMood || "No mood selected"}</span>
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          In the next phase we will plug in a real map experience with filters that react to your mood.
          For now, use this page to confirm your selection and plan the integrations you will need.
        </p>
      </section>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-emerald-400/30 bg-slate-900/80 px-8 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-3xl font-bold text-emerald-200">
          🗺️
        </div>
        <h3 className="text-2xl font-semibold text-emerald-200">Map module coming soon</h3>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Use this empty state to outline API calls, map providers, and mood-based filters. Keeping it visually
          polished now will make it easier to swap in the live map when you reach that milestone.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
        >
          Choose a different mood
        </button>
      </div>
    </main>
  );
};

export default Map;
