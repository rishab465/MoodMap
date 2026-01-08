const MoodCard = ({ mood, caption, icon, iconBg, textColor, isSelected, onSelect }) => {
  const accentHeading = textColor ?? "text-slate-900";

  return (
    <button
      type="button"
      onClick={() => onSelect(mood)}
      className={`group relative flex h-full w-full flex-col gap-4 rounded-3xl border px-7 py-8 text-left shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        isSelected
          ? "border-emerald-300 bg-white shadow-lg ring-2 ring-emerald-300"
          : "border-emerald-100 bg-white/80 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
      }`}
    >
      <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${iconBg}`}>
        {icon}
      </span>
      <div className="flex items-center gap-3">
        <h3 className={`text-2xl font-semibold ${accentHeading}`}>{mood}</h3>
        {isSelected ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Selected
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-6 text-slate-600">{caption}</p>
      <span
        className={`mt-auto inline-flex items-center gap-2 text-xs font-semibold transition ${
          isSelected ? "text-emerald-600" : "text-emerald-500/70 group-hover:text-emerald-600"
        }`}
      >
        Explore matches
        <span aria-hidden>↗</span>
      </span>
    </button>
  );
};

export default MoodCard;
