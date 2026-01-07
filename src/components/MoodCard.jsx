const MoodCard = ({ mood, caption, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(mood)}
      className={`group w-full rounded-2xl border-2 px-6 py-7 text-left transition-all duration-200 ${
        isSelected
          ? "border-emerald-400/80 bg-emerald-500/15 shadow-xl shadow-emerald-500/10"
          : "border-slate-800 bg-slate-800/80 hover:-translate-y-1 hover:border-emerald-300/70 hover:bg-slate-800"
      }`}
    >
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-lg font-semibold transition-colors ${
          isSelected ? "bg-emerald-400 text-slate-900" : "bg-slate-700 text-emerald-200 group-hover:bg-emerald-300 group-hover:text-slate-900"
        }`}
      >
        {mood.charAt(0)}
      </span>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-emerald-200">{mood}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300/90">{caption}</p>
    </button>
  );
};

export default MoodCard;
