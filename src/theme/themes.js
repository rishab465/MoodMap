export const SUPPORTED_MOODS = ["Happy", "Sad", "Angry", "Calm"];

export const DEFAULT_MOOD = "Calm";

export const MOOD_THEMES = {
  Happy: {
    name: "Happy",
    className: "theme-happy",
    description: "Energetic, optimistic, joyful",
  },
  Sad: {
    name: "Sad",
    className: "theme-sad",
    description: "Comforting, quiet, emotionally safe",
  },
  Angry: {
    name: "Angry",
    className: "theme-angry",
    description: "Powerful, grounded, controlled intensity",
  },
  Calm: {
    name: "Calm",
    className: "theme-calm",
    description: "Peaceful, natural, balanced",
  },
};

export const normalizeMood = (candidate) => {
  if (!candidate || typeof candidate !== "string") {
    return DEFAULT_MOOD;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return DEFAULT_MOOD;
  }

  const match = SUPPORTED_MOODS.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return match || DEFAULT_MOOD;
};
