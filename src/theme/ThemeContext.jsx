import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_MOOD, MOOD_THEMES, SUPPORTED_MOODS, normalizeMood } from "./themes.js";

const STORAGE_KEY = "moodmap:lastMood";

const ThemeContext = createContext({
  mood: DEFAULT_MOOD,
  setMood: () => {},
  theme: MOOD_THEMES[DEFAULT_MOOD],
  availableMoods: SUPPORTED_MOODS,
});

export const ThemeProvider = ({ initialMood, children }) => {
  const [mood, setMoodState] = useState(() => {
    if (initialMood) {
      return normalizeMood(initialMood);
    }

    if (typeof window === "undefined") {
      return DEFAULT_MOOD;
    }

    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return DEFAULT_MOOD;
      }
      return normalizeMood(stored);
    } catch (error) {
      console.warn("Failed to read stored mood", error);
      return DEFAULT_MOOD;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, mood);
    } catch (error) {
      console.warn("Failed to persist mood", error);
    }
  }, [mood]);

  const setMood = (nextMood) => {
    setMoodState((current) => {
      const normalized = normalizeMood(nextMood);
      if (normalized === current) {
        return current;
      }
      return normalized;
    });
  };

  const value = useMemo(() => {
    const theme = MOOD_THEMES[mood] ?? MOOD_THEMES[DEFAULT_MOOD];
    return {
      mood,
      setMood,
      theme,
      availableMoods: SUPPORTED_MOODS,
    };
  }, [mood]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
