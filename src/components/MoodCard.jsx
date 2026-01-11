const MoodCard = ({
  value,
  title,
  caption,
  description,
  icon,
  gradient,
  textColor,
  shadow,
  isSelected,
  onSelect,
}) => {
  const resolvedTitle = title ?? value;
  const styleVars = {
    "--card-selected-bg": gradient,
    "--card-selected-text": textColor,
    "--card-selected-shadow": shadow,
    "--card-preview-gradient": gradient,
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      style={styleVars}
      className={`card-option flex h-full flex-col gap-6 p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/65 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        isSelected ? "card-selected" : ""
      }`}
    >
        <span className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
          {icon}
        </span>
          <span className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.35em] text-subtle">Mood</span>
            <h3 className="text-2xl font-semibold">{resolvedTitle}</h3>
        </span>
      </span>
      <p className="text-sm leading-6 text-secondary">{caption}</p>
      <p className="text-xs leading-6 text-subtle">{description}</p>
      <span className="cta mt-auto inline-flex items-center gap-2 text-xs font-semibold">
        Explore matches
        <span aria-hidden>↗</span>
      </span>
    </button>
  );
};

export default MoodCard;
